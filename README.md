# Amplication Plugins

This repository contains a collection of plugins for Amplication, a powerful open-source development platform designed to help you develop quality Node.js applications without spending time on repetitive coding tasks.

## Overview

Amplication plugins extend the core functionality of the platform, allowing you to customize and enhance your applications with various features and integrations. The plugins are organized into several categories based on their functionality.

## Plugin Categories

### Authentication Plugins

- **auth-auth0**: Auth0 integration for authentication
- **auth-basic**: Basic authentication implementation
- **auth-core**: Core authentication functionality
- **auth-jwt**: JWT-based authentication
- **auth-keycloak**: Keycloak integration for authentication
- **auth-supertokens**: SuperTokens integration for authentication

### Message Broker Plugins

- **broker-kafka**: Apache Kafka integration
- **broker-nats**: NATS messaging system integration
- **broker-rabbitmq**: RabbitMQ integration
- **broker-redis**: Redis pub/sub integration

### Caching Plugins

- **cache-redis**: Redis caching implementation

### CI/CD Plugins

- **ci-github-actions**: GitHub Actions integration for CI/CD

### Database Plugins

- **db-mongo**: MongoDB integration
- **db-mysql**: MySQL integration
- **db-postgres**: PostgreSQL integration
- **db-sqlserver**: SQL Server integration

### Deployment Plugins

- **deployment-github-actions-aws-ecs**: AWS ECS deployment via GitHub Actions
- **deployment-helm-chart**: Kubernetes Helm chart deployment

### Code Quality Plugins

- **formatter-prettier**: Prettier code formatting integration
- **linter-eslint**: ESLint integration for code linting

### Integration Plugins

- **integration-openai**: OpenAI integration

### Logging Plugins

- **logger-json**: JSON-based logging implementation

### Observability Plugins

- **observability-opentelemetry**: OpenTelemetry integration for observability

### Provisioning Plugins

#### AWS
- **provisioning-terraform-aws-core**: AWS core infrastructure with Terraform
- **provisioning-terraform-aws-database-rds**: AWS RDS database provisioning
- **provisioning-terraform-aws-deployment-ecs**: AWS ECS deployment provisioning
- **provisioning-terraform-aws-repository-ecr**: AWS ECR repository provisioning

#### GCP
- **provisioning-terraform-gcp-core**: GCP core infrastructure with Terraform
- **provisioning-terraform-gcp-database-csql**: GCP Cloud SQL database provisioning
- **provisioning-terraform-gcp-repository-ar**: GCP Artifact Registry provisioning

### Secrets Management Plugins

- **secrets-manager-aws-secret-manager**: AWS Secrets Manager integration
- **secrets-manager-azure-key-vault**: Azure Key Vault integration
- **secrets-manager-bitwarden**: Bitwarden integration
- **secrets-manager-google-secret-manager**: Google Secret Manager integration
- **secrets-manager-hashicorp-vault**: HashiCorp Vault integration

### API Documentation Plugins

- **swagger-apibody**: Swagger/OpenAPI documentation generation

### Transport Plugins

- **transport-grpc**: gRPC transport implementation
- **transport-https**: HTTPS transport implementation

## Templates

- **plugin-template**: Template for creating new plugins
- **sapphire-template**: Sapphire template for application development

## Getting Started

To use these plugins with your Amplication project, refer to the individual plugin documentation for installation and configuration instructions.

## Development

This project uses NX for managing the monorepo. To set up the development environment:

1. Clone the repository
2. Install dependencies: `npm install`
3. Build all plugins: `nx run-many --target=build --all`

## License

This project is licensed under the MIT License - see the LICENSE file for details.