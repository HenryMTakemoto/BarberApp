# BarberApp API Documentation

Base URL: `http://localhost:8080`

---

## Auth

### POST /api/auth/login
Login com email e senha.
```json
// Request
{ "email": "rafael@barber.com", "password": "123456" }

// Response 200
{ "token": "eyJ...", "user": { ...UserDTO } }
```

### POST /api/users
Registro de novo usuário.
```json
// Request
{ "name": "João", "email": "joao@email.com", "password": "senha123" }

// Response 201
{ "id": 1, "name": "João", "email": "joao@email.com", "role": "CLIENT" }
```

### POST /api/auth/google
Login/registro via Google OAuth2.
```json
// Request — primeiro login (sem role retorna NEW_USER)
{ "idToken": "google-id-token" }

// Request — criando conta com role
{ "idToken": "google-id-token", "role": "CLIENT" }

// Response — usuário existente
{ "status": "EXISTING_USER", "token": "eyJ...", "user": { ...UserDTO } }

// Response — novo usuário sem role
{ "status": "NEW_USER", "email": "...", "name": "...", "avatarUrl": "..." }

// Response — conta criada
{ "status": "CREATED", "token": "eyJ...", "user": { ...UserDTO } }
```

---

## Users

### GET /api/users/nearby-barbers
Radar de barbeiros próximos.
```
?lat=-23.5505&lng=-46.6333&radius=10&specialty=Degradê
```
```json
// Response 200
[{
  "id": 19,
  "name": "Rafael Mendes",
  "email": "rafael@barber.com",
  "role": "BARBER",
  "avatarUrl": "...",
  "specialties": ["Degradê", "Barba"],
  "address": { "street": "...", "city": "...", "latitude": -23.55, "longitude": -46.63 },
  "distanceKm": 0.4,
  "rating": 4.9,
  "reviewCount": 312
}]
```

### GET /api/users/{id}
Perfil público de um usuário.

---

## Appointments

### POST /api/appointments
Cria agendamento. **Requer token.**
```json
// Request
{
  "clientId": 22,
  "barberId": 19,
  "specialtyId": 1,
  "date": "2026-03-20T10:00:00"
}
// Response 201 — AppointmentDTO
```

### GET /api/appointments/client/{clientId}
Agendamentos do cliente. **Requer token.**

### GET /api/appointments/barber/{barberId}
Agenda do barbeiro. **Público.**

### GET /api/appointments/barber/{barberId}/date/{date}
Agenda do barbeiro por data. `date` formato: `YYYY-MM-DD`. **Público.**

### PATCH /api/appointments/{id}/status
Atualiza status. **Requer token.**
```json
// Request
{ "status": "CONFIRMED" }
// Status válidos: PENDING | CONFIRMED | CANCELED | COMPLETED
```

---

## Services

### GET /api/barbers/{barberId}/services
Lista serviços do barbeiro. **Público.**
```json
// Response 200
[{ "id": 1, "name": "Corte Degradê", "duration": 45, "price": 65.0, "barberId": 19 }]
```

### POST /api/barbers/{barberId}/services
Cria serviço. **Requer token.**
```json
// Request
{ "name": "Corte Degradê", "duration": 45, "price": 65.0 }
```

### PUT /api/barbers/{barberId}/services/{serviceId}
Atualiza serviço. **Requer token.**

### DELETE /api/barbers/{barberId}/services/{serviceId}
Remove serviço. **Requer token.**

---

## Reviews

### POST /api/reviews
Cria avaliação. **Requer token.**
```json
// Request
{
  "rating": 5,
  "comment": "Excelente!",
  "clientId": 22,
  "appointmentId": 3
}
// Regras: appointment deve ser COMPLETED e pertencer ao clientId
```

### GET /api/barbers/{barberId}/reviews
Lista avaliações do barbeiro. **Público.**

### GET /api/barbers/{barberId}/rating
Rating médio do barbeiro. **Público.**
```json
// Response
{ "barberId": 19, "averageRating": 4.9, "reviewCount": 312 }
```

---

## Availability

### POST /api/barbers/{barberId}/availability/periods
Cadastra período de trabalho. **Requer token.**
```json
// Request
{ "dayOfWeek": 1, "startTime": "08:00", "endTime": "12:00", "slotDurationMinutes": 45 }
// dayOfWeek: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
```

### GET /api/barbers/{barberId}/availability/periods
Lista períodos do barbeiro. **Público.**

### DELETE /api/barbers/{barberId}/availability/periods/{periodId}
Remove período. **Requer token.**

### POST /api/barbers/{barberId}/availability/blocked
Cria bloqueio pontual. **Requer token.**
```json
// Request
{ "blockedDate": "2026-03-23", "startTime": "12:00", "endTime": "13:00", "reason": "Lunch" }
```

### GET /api/barbers/{barberId}/availability/blocked
Lista bloqueios futuros. **Requer token.**

### DELETE /api/barbers/{barberId}/availability/blocked/{blockedId}
Remove bloqueio. **Requer token.**

### GET /api/barbers/{barberId}/availability/slots?date=YYYY-MM-DD
Slots disponíveis para uma data. **Público.**
```json
// Response 200
["08:00", "08:45", "09:30", "10:15", "11:00"]

// Response 404 — barbeiro não trabalha nesse dia
{ "status": 404, "error": "Barber does not work on this day" }
```

---

## UserDTO (estrutura comum)
```json
{
  "id": 19,
  "name": "Rafael Mendes",
  "email": "rafael@barber.com",
  "phoneNumber": null,
  "role": "BARBER",
  "avatarUrl": "https://...",
  "specialties": ["Degradê", "Barba"],
  "address": {
    "street": "Av. Paulista",
    "number": "1200",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01310-100",
    "latitude": -23.5505,
    "longitude": -46.6333
  },
  "distanceKm": 0.4,
  "rating": 4.9,
  "reviewCount": 312
}
```