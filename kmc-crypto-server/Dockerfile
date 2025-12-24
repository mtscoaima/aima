FROM maven:3.8-eclipse-temurin-8 AS build
WORKDIR /app
COPY pom.xml .
COPY libs ./libs
COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:8-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
COPY --from=build /app/libs ./libs
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

