package com.barberapp.backend.service;

import com.barberapp.backend.dto.AvailabilityDTO;
import com.barberapp.backend.dto.BlockedSlotDTO;
import com.barberapp.backend.model.*;
import com.barberapp.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AvailabilityService {

    private final AvailabilityRepository availabilityRepository;
    private final BlockedSlotRepository blockedSlotRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    private static final DateTimeFormatter TIME_FMT =
            DateTimeFormatter.ofPattern("HH:mm");

    // Save a work period
    // Allows multiple periods per day (morning + afternoon)
    public AvailabilityDTO savePeriod(Long barberId, AvailabilityDTO dto) {
        User barber = userRepository.findById(barberId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Barber not found: " + barberId));

        validateTimes(dto.getStartTime(), dto.getEndTime());

        // If dto has an id, update existing period — otherwise create new one
        BarberAvailability availability = dto.getId() != null
                ? availabilityRepository.findById(dto.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Period not found"))
                : BarberAvailability.builder().barber(barber).build();

        availability.setDayOfWeek(dto.getDayOfWeek());
        availability.setStartTime(dto.getStartTime());
        availability.setEndTime(dto.getEndTime());
        availability.setSlotDurationMinutes(dto.getSlotDurationMinutes());

        return convertAvailToDTO(availabilityRepository.save(availability));
    }

    // List all work periods for a barber
    public List<AvailabilityDTO> getPeriods(Long barberId) {
        return availabilityRepository.findByBarberId(barberId)
                .stream()
                .map(this::convertAvailToDTO)
                .collect(Collectors.toList());
    }

    // Delete a work period
    public void deletePeriod(Long periodId) {
        if (!availabilityRepository.existsById(periodId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Period not found: " + periodId);
        }
        availabilityRepository.deleteById(periodId);
    }

    // Save a blocked slot (lunch, meeting, etc)
    public BlockedSlotDTO saveBlockedSlot(Long barberId, BlockedSlotDTO dto) {
        User barber = userRepository.findById(barberId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Barber not found: " + barberId));

        validateTimes(dto.getStartTime(), dto.getEndTime());

        BlockedSlot blocked = BlockedSlot.builder()
                .barber(barber)
                .blockedDate(dto.getBlockedDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .reason(dto.getReason())
                .build();

        return convertBlockedToDTO(blockedSlotRepository.save(blocked));
    }

    // List all upcoming blocked slots for a barber
    public List<BlockedSlotDTO> getBlockedSlots(Long barberId) {
        return blockedSlotRepository
                .findByBarberIdAndBlockedDateGreaterThanEqual(
                        barberId, LocalDate.now())
                .stream()
                .map(this::convertBlockedToDTO)
                .collect(Collectors.toList());
    }

    // Delete a blocked slot
    public void deleteBlockedSlot(Long blockedSlotId) {
        if (!blockedSlotRepository.existsById(blockedSlotId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Blocked slot not found");
        }
        blockedSlotRepository.deleteById(blockedSlotId);
    }

    // Generate available slots for a specific date
    public List<String> getAvailableSlots(Long barberId, LocalDate date) {

        // Find the day of week (0=Sun ... 6=Sat)
        int dayOfWeek = date.getDayOfWeek().getValue() % 7;

        // Fetch all work periods for this barber on this weekday
        List<BarberAvailability> periods = availabilityRepository
                .findByBarberIdAndDayOfWeek(barberId, dayOfWeek);

        if (periods.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Barber does not work on this day");
        }

        // Generate all possible slots from each period
        // example: Morning 08:00-12:00 + Afternoon 13:00-18:00
        List<String> allSlots = new ArrayList<>();
        for (BarberAvailability period : periods) {
            allSlots.addAll(generateSlots(
                    period.getStartTime(),
                    period.getEndTime(),
                    period.getSlotDurationMinutes()));
        }

        // Fetch appointments already booked on this day (PENDING or CONFIRMED)
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);

        Set<String> occupiedByAppointments = appointmentRepository
                .findByBarberIdAndDateBetweenOrderByDateAsc(
                        barberId, startOfDay, endOfDay)
                .stream()
                .filter(a -> a.getStatus() == AppointmentStatus.PENDING
                        || a.getStatus() == AppointmentStatus.CONFIRMED)
                .map(a -> a.getDate().toLocalTime().format(TIME_FMT))
                .collect(Collectors.toSet());

        // Fetch manually blocked slots for this specific date
        // example: lunch 12:00-13:00, meeting 15:00-15:30
        List<BlockedSlot> blockedSlots = blockedSlotRepository
                .findByBarberIdAndBlockedDate(barberId, date);

        // Check which slots fall inside a blocked range
        Set<String> occupiedByBlocks = new HashSet<>();
        for (String slot : allSlots) {
            LocalTime slotTime = LocalTime.parse(slot, TIME_FMT);
            for (BlockedSlot block : blockedSlots) {
                LocalTime blockStart = LocalTime.parse(block.getStartTime(), TIME_FMT);
                LocalTime blockEnd = LocalTime.parse(block.getEndTime(), TIME_FMT);
                // Slot is inside the blocked range if: slot >= blockStart && slot < blockEnd
                if (!slotTime.isBefore(blockStart) && slotTime.isBefore(blockEnd)) {
                    occupiedByBlocks.add(slot);
                    break;
                }
            }
        }

        // Remove all occupied slots from the full list
        allSlots.removeAll(occupiedByAppointments);
        allSlots.removeAll(occupiedByBlocks);

        // Step 8: Sort and return available slots
        if (date.equals(LocalDate.now())) {
            LocalTime currentTime = LocalTime.now();
            
            allSlots.removeIf(slot -> {
                LocalTime slotTime = LocalTime.parse(slot, TIME_FMT);
                return slotTime.isBefore(currentTime);
            });
        }
        // -----------------------------------------------------------------------------

        // Step 8: Sort and return available slots
        allSlots.sort(Comparator.naturalOrder());

        return allSlots;
    }

    // ── Generate time slots between start and end with a fixed interval ──
    private List<String> generateSlots(String startTime, String endTime,
                                       int slotDuration) {
        List<String> slots = new ArrayList<>();
        LocalTime current = LocalTime.parse(startTime, TIME_FMT);
        LocalTime end = LocalTime.parse(endTime, TIME_FMT);

        while (current.isBefore(end)) {
            slots.add(current.format(TIME_FMT));
            current = current.plusMinutes(slotDuration);
        }
        return slots;
    }

    // Validate that start time is strictly before end time
    private void validateTimes(String start, String end) {
        if (!LocalTime.parse(start, TIME_FMT)
                .isBefore(LocalTime.parse(end, TIME_FMT))) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Start time must be before end time");
        }
    }

    private AvailabilityDTO convertAvailToDTO(BarberAvailability a) {
        return AvailabilityDTO.builder()
                .id(a.getId())
                .barberId(a.getBarber().getId())
                .dayOfWeek(a.getDayOfWeek())
                .startTime(a.getStartTime())
                .endTime(a.getEndTime())
                .slotDurationMinutes(a.getSlotDurationMinutes())
                .build();
    }

    private BlockedSlotDTO convertBlockedToDTO(BlockedSlot b) {
        return BlockedSlotDTO.builder()
                .id(b.getId())
                .barberId(b.getBarber().getId())
                .blockedDate(b.getBlockedDate())
                .startTime(b.getStartTime())
                .endTime(b.getEndTime())
                .reason(b.getReason())
                .build();
    }
}