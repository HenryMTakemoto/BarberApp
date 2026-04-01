# BarberApp

---

## Português

### 📖 Sobre o Projeto
**BarberApp** é uma plataforma inovadora de agendamento de barbeiros baseada em **Geolocalização (LBS - Location-Based Services)** e **Inteligência Artificial**. O sistema conecta clientes aos melhores profissionais da região, oferecendo um fluxo de agendamento fluido e recomendações personalizadas impulsionadas por IA.

O aplicativo utiliza o conceito de **Progressive Profiling**, onde qualquer utilizador se registra inicialmente como cliente e, ao preencher os seus dados de serviço e especialidades, é automaticamente promovido a profissional (Barbeiro).

### 🚀 Principais Funcionalidades
- **Radar de Barbeiros (LBS):** Busca de profissionais próximos utilizando a Fórmula de Haversine nativa no banco de dados para calcular distâncias reais e curvatura da Terra.
- **Motor de Agendamentos Inteligente:** Geração dinâmica de horários disponíveis baseada nos turnos do barbeiro, prevenindo conflitos e bloqueando horários que já passaram.
- **Avaliações e Score:** Sistema seguro de reviews (apenas para agendamentos concluídos) que alimenta o algoritmo de recomendação.
- **Recomendações por IA (LLaMA 3.3):**
  - *Para Clientes:* Recomenda o barbeiro ideal cruzando o histórico do cliente com os profissionais disponíveis.
  - *Para Barbeiros:* Fornece *insights* de negócio e dicas de marketing baseadas no seu faturamento e volume de agendamentos.
- **Autenticação Segura:** Implementação de Spring Security com senhas encriptadas via BCrypt e tokens JWT.

### 🛠️ Tecnologias Utilizadas
**Frontend (Mobile):**
- React Native (Expo)
- TypeScript
- React Navigation

**Backend (API Rest):**
- Java 17+
- Spring Boot (Web, Data JPA, Security, Validation)
- RestTemplate (Orquestração de LLMs)
- PostgreSQL (Hospedado no Supabase)

### 🧠 Destaques da Arquitetura
Este projeto implementa o padrão de **Orquestração de LLM (LLM Orchestration/RAG)**. A Inteligência Artificial (Groq API) não possui acesso direto ao banco de dados. O Backend atua como orquestrador, filtrando dados relacionais estritos (ex: barbeiros num raio de 50km, cálculo financeiro) e injetando-os estruturadamente no *prompt*, garantindo 100% de privacidade dos dados dos utilizadores e prevenindo alucinações da IA.

---

## 🇺🇸 English

### 📖 About the Project
**BarberApp** is an innovative barbershop scheduling platform built on **Location-Based Services (LBS)** and **Artificial Intelligence**. The system seamlessly connects clients with the best local professionals, offering a smooth booking flow and AI-driven personalized recommendations.

The app leverages **Progressive Profiling**, where any user registers initially as a client and, upon filling out their service details and specialties, is automatically promoted to a professional (Barber).

### 🚀 Key Features
- **Barber Radar (LBS):** Search for nearby professionals using the native Haversine Formula in the database to calculate real-world distances and Earth's curvature.
- **Smart Booking Engine:** Dynamic generation of available time slots based on the barber's shifts, preventing booking collisions and blocking past hours.
- **Reviews & Scoring:** Secure review system (only for completed appointments) that feeds the recommendation algorithm.
- **AI Recommendations (LLaMA 3.3):**
  - *For Clients:* Recommends the ideal barber within a 50km radius by cross-referencing the client's history with available professionals.
  - *For Barbers:* Provides business insights and marketing tips based on their revenue and appointment volume.
- **Secure Authentication:** Spring Security implementation with BCrypt password hashing and JWT tokens.

### 🛠️ Tech Stack
**Frontend (Mobile):**
- React Native (Expo)
- TypeScript
- React Navigation

**Backend (REST API):**
- Java 17+
- Spring Boot (Web, Data JPA, Security, Validation)
- RestTemplate (LLM Orchestration)
- PostgreSQL (Hosted on Supabase)

### 🧠 Architecture Highlights
This project implements the **LLM Orchestration (RAG)** pattern. The Artificial Intelligence (Groq API) does not have direct access to the database. The Backend acts as an orchestrator, filtering strict relational data (e.g., barbers within a 50km radius, financial calculations) and injecting it structurally into the prompt. This ensures 100% data privacy for users and prevents AI hallucinations.

---

### 💻 Como Executar / Getting Started

#### Backend (Spring Boot)
1. Clone the repository.
2. Navigate to the `/backend` folder.
3. Update the `application.properties` file with your PostgreSQL (Supabase) and Groq API credentials.
4. Run the application:
   ```bash
   ./mvnw spring-boot:run