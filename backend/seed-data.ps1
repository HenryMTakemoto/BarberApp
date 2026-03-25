$baseUrl = "http://localhost:8080/api"

# 1. Helper function
function Register-User {
    param ($name, $email, $role, $lat, $lng, $password = "123456")
    
    $body = @{
        name = $name
        email = $email
        password = $password
        phone = "11999999999"
        role = $role
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/users/register" -Method Post -Body $body -ContentType "application/json"
    $userId = $response.id
    
    # Update Location
    $locBody = @{
        latitude = $lat
        longitude = $lng
        address = "Address for $name"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/users/$userId/location" -Method Put -Body $locBody -ContentType "application/json"
    
    return $userId
}

function Add-Service {
    param ($barberId, $name, $price, $duration)
    
    $body = @{
        name = $name
        description = "Great $name"
        price = $price
        durationMinutes = $duration
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/barbers/$barberId/services" -Method Post -Body $body -ContentType "application/json"
    return $response.id
}

function Add-Appointment {
    param ($clientId, $barberId, $serviceId, $dateStr, $status)
    
    $body = @{
        clientId = $clientId
        barberId = $barberId
        serviceId = $serviceId
        date = $dateStr
        status = $status
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "$baseUrl/appointments" -Method Post -Body $body -ContentType "application/json"
}

Write-Host "Registering Barbers..."
# SP Origin is -23.5505, -46.6333
# Barber 1: Very close (2km) - Specialty: Navalhado
$b1 = Register-User "Barber Navalha SP" "b1@test.com" "BARBER" -23.5550 -46.6300
$s1_1 = Add-Service $b1 "Navalhado" 40.0 30
$s1_2 = Add-Service $b1 "Barba" 25.0 20

# Barber 2: Medium distance (8km) - Specialty: Degradê, Coloração
$b2 = Register-User "Studio Degradê" "b2@test.com" "BARBER" -23.6000 -46.6800
$s2_1 = Add-Service $b2 "Degradê" 35.0 40
$s2_2 = Add-Service $b2 "Coloração" 70.0 60

# Barber 3: Medium distance (12km) - Specialty: Afro, Tranças
$b3 = Register-User "Afro Roots" "b3@test.com" "BARBER" -23.6200 -46.7200
$s3_1 = Add-Service $b3 "Afro" 45.0 45
$s3_2 = Add-Service $b3 "Tranças" 120.0 120

# Barber 4: Far (30km)
$b4 = Register-User "Barbearia Longe" "b4@test.com" "BARBER" -23.8000 -46.9000
$s4_1 = Add-Service $b4 "Clássico" 30.0 30

Write-Host "Registering Clients and Appointments..."
# Client 1: Prefers Degradê
$c1 = Register-User "Cliente Teste 1" "c1@test.com" "CLIENT" -23.5505 -46.6333
# Add history for AI to pick up Degrade
Add-Appointment $c1 $b2 $s2_1 "2026-03-01T10:00:00" "COMPLETED"
Add-Appointment $c1 $b2 $s2_1 "2026-03-15T15:00:00" "COMPLETED"

# Client 2: Prefers Afro
$c2 = Register-User "Cliente Teste 2" "c2@test.com" "CLIENT" -23.5505 -46.6333
Add-Appointment $c2 $b3 $s3_1 "2026-03-05T14:00:00" "COMPLETED"
Add-Appointment $c2 $b3 $s3_2 "2026-03-20T11:00:00" "COMPLETED"

# Populate heavy history for Barber 1 to test Barber Ganhos AI
# 10 completed appointments
for ($i=1; $i -le 10; $i++) {
    $day = $i.ToString("00")
    Add-Appointment $c1 $b1 $s1_1 "2026-03-$day`T09:00:00" "COMPLETED"
}

Write-Host "Seed completed!"
