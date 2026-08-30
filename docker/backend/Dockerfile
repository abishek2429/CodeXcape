FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY . .
WORKDIR /app/backend
RUN mvn clean package -DskipTests


# Runtime Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/backend/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Xmx300m", "-Xms300m", "-jar", "app.jar"]
