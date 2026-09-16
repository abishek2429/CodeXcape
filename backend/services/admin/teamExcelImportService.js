const xlsx = require('xlsx');
const eventRepository = require('../../repositories/eventRepository');
const teamRepository = require('../../repositories/teamRepository');
const playerRepository = require('../../repositories/playerRepository');
const gameStateService = require('../gameStateService');
const adminAuditService = require('./adminAuditService');
const { ResourceNotFoundException } = require('../../middleware/errorHandler');

const MAX_TEAM_NAME_LENGTH = 100;
const MAX_PLAYER_NAME_LENGTH = 100;

class TeamExcelImportService {
  async parseAndValidate(eventId, fileBuffer, originalFilename) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new ResourceNotFoundException(`Event not found for ID ${eventId}`);
    }

    this._validateEventEditable(event);
    this._validateFileFormat(originalFilename, fileBuffer);

    const rows = this._parseExcelBuffer(fileBuffer);
    await this._validateRows(rows, eventId);

    const validCount = rows.filter(r => r.valid).length;
    const invalidCount = rows.filter(r => !r.valid).length;
    const duplicateCount = rows.filter(r => r.validationErrors.some(e => e.includes('Duplicate'))).length;

    const globalErrors = [];
    if (rows.length === 0) {
      globalErrors.push('No data rows found in the Excel file.');
    }
    if (validCount === 0 && rows.length > 0) {
      globalErrors.push('All rows have validation errors. No teams can be imported.');
    }

    const warnings = [];
    if (invalidCount > 0) {
      warnings.push(`${invalidCount} row(s) have validation errors and will be skipped during import.`);
    }

    return {
      totalRows: rows.length,
      validRows: validCount,
      invalidRows: invalidCount,
      duplicateRows: duplicateCount,
      rows,
      errors: globalErrors,
      warnings,
      importReady: validCount > 0 && globalErrors.length === 0
    };
  }

  async importTeams(eventId, fileBuffer, originalFilename, principal) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new ResourceNotFoundException(`Event not found for ID ${eventId}`);
    }

    this._validateEventEditable(event);

    const rows = this._parseExcelBuffer(fileBuffer);
    await this._validateRows(rows, eventId);

    const validRows = rows.filter(r => r.valid);

    if (validRows.length === 0) {
      return {
        teamsCreated: 0,
        playersCreated: 0,
        duplicatesSkipped: rows.length,
        errorsEncountered: rows.length,
        errors: ['No valid rows to import.'],
        summary: 'Import aborted: no valid team rows found.'
      };
    }

    let teamsCreated = 0;
    let playersCreated = 0;
    const createdCodes = [];
    const importErrors = [];

    const currentTeamCount = await teamRepository.countByEventId(eventId);

    for (const row of validRows) {
      try {
        const countForCode = currentTeamCount + teamsCreated;
        const teamCode = await this._generateUniqueTeamCode(eventId, countForCode);

        const team = await teamRepository.createTeam({
          eventId: event.id,
          teamCode,
          teamName: row.teamName.trim(),
          status: 'REGISTERED',
          gameState: 'NOT_STARTED'
        });

        await playerRepository.create({
          teamId: team.id,
          playerNumber: 1,
          displayName: row.player1Name.trim(),
          status: 'INACTIVE'
        });

        await playerRepository.create({
          teamId: team.id,
          playerNumber: 2,
          displayName: row.player2Name.trim(),
          status: 'INACTIVE'
        });

        const fullTeam = await teamRepository.findById(team.id);
        await gameStateService.initializeTeamGameState(fullTeam);

        teamsCreated++;
        playersCreated += 2;
        createdCodes.push(teamCode);
      } catch (err) {
        importErrors.push(`Row ${row.rowNumber} ('${row.teamName}'): ${err.message}`);
        throw new Error(`Import failed at row ${row.rowNumber}: ${err.message}`);
      }
    }

    const duplicatesSkipped = rows.length - validRows.length;

    await adminAuditService.logAction(
      principal,
      'EXCEL_TEAM_IMPORT',
      `Event #${eventId}`,
      `Imported ${teamsCreated} teams (${playersCreated} players) from Excel. ${duplicatesSkipped} rows skipped.`
    );

    const summary = `Import complete: ${teamsCreated} teams created, ${playersCreated} players created, ${duplicatesSkipped} rows skipped.`;

    return {
      teamsCreated,
      playersCreated,
      duplicatesSkipped,
      errorsEncountered: importErrors.length,
      createdTeamCodes: createdCodes,
      errors: importErrors,
      importTimestamp: new Date().toISOString(),
      summary
    };
  }

  _parseExcelBuffer(buffer) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      const err = new Error('Excel file contains no sheets.');
      err.status = 400;
      throw err;
    }

    const sheet = workbook.Sheets[firstSheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });

    const rows = [];
    // Row 0 is header, data starts at index 1
    for (let i = 1; i < data.length; i++) {
      const rowArr = data[i] || [];
      const teamName = rowArr[0] ? String(rowArr[0]).trim() : '';
      const player1Name = rowArr[1] ? String(rowArr[1]).trim() : '';
      const player2Name = rowArr[2] ? String(rowArr[2]).trim() : '';

      if (!teamName && !player1Name && !player2Name) {
        continue;
      }

      rows.push({
        rowNumber: i + 1,
        teamName: teamName || null,
        player1Name: player1Name || null,
        player2Name: player2Name || null,
        valid: true,
        validationErrors: []
      });
    }

    return rows;
  }

  async _validateRows(rows, eventId) {
    const seenTeamNames = new Set();
    const existingTeams = await teamRepository.findByEventId(eventId);
    const existingTeamNames = new Set(
      existingTeams.map(t => (t.teamName ? t.teamName.toLowerCase().trim() : ''))
    );

    for (const row of rows) {
      const addError = (msg) => {
        row.validationErrors.push(msg);
        row.valid = false;
      };

      if (!row.teamName || !row.teamName.trim()) {
        addError('Team name is missing.');
      } else if (row.teamName.length > MAX_TEAM_NAME_LENGTH) {
        addError(`Team name exceeds ${MAX_TEAM_NAME_LENGTH} characters.`);
      } else if (this._containsInvalidCharacters(row.teamName)) {
        addError('Team name contains invalid characters.');
      } else {
        const norm = row.teamName.toLowerCase().trim();
        if (seenTeamNames.has(norm)) {
          addError('Duplicate team name within this import file.');
        } else if (existingTeamNames.has(norm)) {
          addError('Duplicate: team name already exists in this event.');
        } else {
          seenTeamNames.add(norm);
        }
      }

      if (!row.player1Name || !row.player1Name.trim()) {
        addError('Player 1 name is missing.');
      } else if (row.player1Name.length > MAX_PLAYER_NAME_LENGTH) {
        addError(`Player 1 name exceeds ${MAX_PLAYER_NAME_LENGTH} characters.`);
      }

      if (!row.player2Name || !row.player2Name.trim()) {
        addError('Player 2 name is missing.');
      } else if (row.player2Name.length > MAX_PLAYER_NAME_LENGTH) {
        addError(`Player 2 name exceeds ${MAX_PLAYER_NAME_LENGTH} characters.`);
      }

      if (row.player1Name && row.player2Name && row.player1Name.trim().toLowerCase() === row.player2Name.trim().toLowerCase()) {
        addError('Player 1 and Player 2 cannot have the same name.');
      }
    }
  }

  _validateEventEditable(event) {
    if (event.status === 'RUNNING' || event.status === 'COMPLETED') {
      const err = new Error(`Cannot import teams: event is currently ${event.status}.`);
      err.status = 400;
      throw err;
    }
  }

  _validateFileFormat(filename, buffer) {
    if (!buffer || buffer.length === 0) {
      const err = new Error('No file uploaded.');
      err.status = 400;
      throw err;
    }
    if (filename && !filename.endsWith('.xlsx') && !filename.endsWith('.xls')) {
      const err = new Error('Invalid file format. Please upload an Excel file (.xlsx).');
      err.status = 400;
      throw err;
    }
    if (buffer.length > 5 * 1024 * 1024) {
      const err = new Error('File size exceeds 5MB limit.');
      err.status = 400;
      throw err;
    }
  }

  _containsInvalidCharacters(s) {
    return !/^[\p{L}\p{N}\s\-_.'&!@#]+$/u.test(s);
  }

  async _generateUniqueTeamCode(eventId, currentCount) {
    let index = currentCount + 1;
    while (true) {
      const code = `TEAM-${String(index).padStart(3, '0')}`;
      const existing = await teamRepository.findByEventIdAndTeamCode(eventId, code);
      if (!existing) {
        return code;
      }
      index++;
    }
  }
}

module.exports = new TeamExcelImportService();
