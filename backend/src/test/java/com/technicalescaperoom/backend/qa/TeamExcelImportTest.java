package com.technicalescaperoom.backend.qa;

import com.technicalescaperoom.backend.dto.admin.TeamImportPreviewDto;
import com.technicalescaperoom.backend.dto.admin.TeamImportResultDto;
import com.technicalescaperoom.backend.entity.Event;
import com.technicalescaperoom.backend.enums.EventStatus;
import com.technicalescaperoom.backend.repository.EventRepository;
import com.technicalescaperoom.backend.repository.PlayerRepository;
import com.technicalescaperoom.backend.repository.TeamRepository;
import com.technicalescaperoom.backend.service.admin.TeamExcelImportService;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class TeamExcelImportTest {

    @Autowired
    private TeamExcelImportService importService;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private PlayerRepository playerRepository;

    private Event testEvent;

    @BeforeEach
    void setup() {
        testEvent = new Event();
        testEvent.setName("Excel Import Test Event");
        testEvent.setPasskeyHash("test_hash");
        testEvent.setStatus(EventStatus.READY);
        testEvent = eventRepository.save(testEvent);
    }

    private MockMultipartFile createExcelFile(String[][] data) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Teams");
            for (int i = 0; i < data.length; i++) {
                Row row = sheet.createRow(i);
                for (int j = 0; j < data[i].length; j++) {
                    if (data[i][j] != null) {
                        row.createCell(j).setCellValue(data[i][j]);
                    }
                }
            }
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            workbook.write(bos);
            return new MockMultipartFile("file", "teams.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bos.toByteArray());
        }
    }

    @Test
    void testValidExcelImport() throws IOException {
        String[][] data = {
                {"Team Name", "Player 1", "Player 2"}, // Header
                {"Alpha Squad", "Alice", "Bob"},
                {"Beta Force", "Charlie", "Diana"}
        };
        MockMultipartFile file = createExcelFile(data);

        TeamImportPreviewDto preview = importService.parseAndValidate(testEvent.getId(), file);

        assertThat(preview.getTotalRows()).isEqualTo(2);
        assertThat(preview.getValidRows()).isEqualTo(2);
        assertThat(preview.isImportReady()).isTrue();

        TeamImportResultDto result = importService.importTeams(testEvent.getId(), file, null);

        assertThat(result.getTeamsCreated()).isEqualTo(2);
        assertThat(result.getPlayersCreated()).isEqualTo(4);
        assertThat(teamRepository.countByEventId(testEvent.getId())).isEqualTo(2);
    }

    @Test
    void testDuplicateTeamNameDetection() throws IOException {
        String[][] data = {
                {"Team Name", "Player 1", "Player 2"},
                {"Alpha Squad", "Alice", "Bob"},
                {"Alpha Squad", "Charlie", "Diana"} // Duplicate in file
        };
        MockMultipartFile file = createExcelFile(data);

        TeamImportPreviewDto preview = importService.parseAndValidate(testEvent.getId(), file);

        assertThat(preview.getTotalRows()).isEqualTo(2);
        assertThat(preview.getValidRows()).isEqualTo(1);
        assertThat(preview.getInvalidRows()).isEqualTo(1);
        assertThat(preview.isImportReady()).isTrue();
        assertThat(preview.getRows().get(1).getValidationErrors().get(0)).contains("Duplicate");
    }

    @Test
    void testMissingFieldsValidation() throws IOException {
        String[][] data = {
                {"Team Name", "Player 1", "Player 2"},
                {"", "Alice", "Bob"}, // Missing team name
                {"Beta Force", "", "Diana"}, // Missing p1
                {"Gamma Ray", "Eve", ""} // Missing p2
        };
        MockMultipartFile file = createExcelFile(data);

        TeamImportPreviewDto preview = importService.parseAndValidate(testEvent.getId(), file);

        assertThat(preview.getValidRows()).isEqualTo(0);
        assertThat(preview.getInvalidRows()).isEqualTo(3);
    }

    @Test
    void testEmptyFileValidation() {
        MockMultipartFile file = new MockMultipartFile("file", "empty.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", new byte[0]);
        assertThrows(IllegalArgumentException.class, () -> importService.parseAndValidate(testEvent.getId(), file));
    }
}
