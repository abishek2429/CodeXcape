# Build Stage
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY . .
WORKDIR /app/backend
RUN mvn clean package -DskipTests

# Runtime Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Non-root user for production container security
RUN addgroup -S codexcape && adduser -S codexcape -G codexcape
USER codexcape:codexcape

COPY --from=builder --chown=codexcape:codexcape /app/backend/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-Xmx350m", "-Xms200m", "-XX:+UseG1GC", "-XX:+ExitOnOutOfMemoryError", "-jar", "app.jar"]
