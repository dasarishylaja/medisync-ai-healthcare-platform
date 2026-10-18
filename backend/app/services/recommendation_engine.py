"""
MediSync AI - Transparent Recommendation Engine
Provides explainable doctor discovery ranking without fabricated diagnostic claims.
Weights:
- Specialty match: 40%
- Available slots fit: 25%
- Preferred time-of-day alignment: 20%
- Patient satisfaction rating: 15%
"""
from typing import List, Dict, Any, Optional
from datetime import date, datetime, timedelta
from app.models import DoctorProfile, DoctorAvailability, Appointment, AppointmentStatus, Specialty

class DoctorRecommendationEngine:
    """
    Ranks doctors transparently based on explicit patient criteria.
    Includes exact human-readable reasoning for every recommendation score.
    """

    def __init__(self, weights: Optional[Dict[str, float]] = None):
        self.weights = weights or {
            "specialty": 0.40,
            "availability": 0.25,
            "time_preference": 0.20,
            "rating": 0.15
        }

    def recommend_doctors(
        self,
        specialty_id: Optional[int] = None,
        preferred_date: Optional[date] = None,
        preferred_time_range: str = "any", # "morning", "afternoon", "any"
        max_results: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Executes multi-criteria scoring on active doctors.
        Returns sorted list of doctors with score breakdown and explanation text.
        """
        query = DoctorProfile.query.filter_by(is_accepting_patients=True)
        if specialty_id:
            query = query.filter_by(specialty_id=specialty_id)

        doctors = query.all()
        target_date = preferred_date or (date.today() + timedelta(days=1))
        target_day_of_week = target_date.weekday()

        ranked_results = []

        for doc in doctors:
            # 1. Specialty Score (100 if matches target specialty or all, 0 otherwise)
            spec_score = 100.0 if (not specialty_id or doc.specialty_id == specialty_id) else 40.0

            # 2. Availability evaluation
            avail = DoctorAvailability.query.filter_by(
                doctor_id=doc.id,
                day_of_week=target_day_of_week,
                is_active=True
            ).first()

            available_slots_count = 0
            has_matching_slot = False

            if avail:
                # Count booked appointments for target date
                booked = Appointment.query.filter(
                    Appointment.doctor_id == doc.id,
                    Appointment.appointment_date == target_date,
                    Appointment.status.in_([AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING])
                ).all()
                booked_slots = {b.start_time for b in booked}

                # Generate slots
                start_h, start_m = map(int, avail.start_time.split(':'))
                end_h, end_m = map(int, avail.end_time.split(':'))
                break_s = avail.break_start_time
                break_e = avail.break_end_time

                curr = datetime(target_date.year, target_date.month, target_date.day, start_h, start_m)
                end = datetime(target_date.year, target_date.month, target_date.day, end_h, end_m)
                duration = timedelta(minutes=avail.slot_duration_minutes)

                while curr + duration <= end:
                    slot_str = curr.strftime("%H:%M")
                    # Check break and booked
                    is_in_break = break_s and break_e and (break_s <= slot_str < break_e)
                    if not is_in_break and slot_str not in booked_slots:
                        available_slots_count += 1
                        hour = curr.hour
                        if preferred_time_range == "morning" and hour < 12:
                            has_matching_slot = True
                        elif preferred_time_range == "afternoon" and hour >= 12:
                            has_matching_slot = True
                        elif preferred_time_range == "any":
                            has_matching_slot = True
                    curr += duration

            avail_score = min(100.0, available_slots_count * 15.0)

            # 3. Time Preference Alignment
            time_pref_score = 100.0 if has_matching_slot else (50.0 if available_slots_count > 0 else 10.0)

            # 4. Rating Score (out of 5 -> scale to 100)
            rating_score = (doc.average_rating / 5.0) * 100.0

            # Composite weighted calculation
            composite_score = (
                (spec_score * self.weights["specialty"]) +
                (avail_score * self.weights["availability"]) +
                (time_pref_score * self.weights["time_preference"]) +
                (rating_score * self.weights["rating"])
            )

            # Build explainable reasoning summary
            reasons = []
            if doc.specialty:
                reasons.append(f"Directly matches {doc.specialty.name} expertise")
            if has_matching_slot and preferred_time_range != "any":
                reasons.append(f"Has open {preferred_time_range} appointments on requested date")
            elif available_slots_count > 0:
                reasons.append(f"{available_slots_count} slots open on {target_date.strftime('%b %d')}")
            else:
                reasons.append(f"Waitlist available for {target_date.strftime('%b %d')}")

            if doc.average_rating >= 4.8:
                reasons.append(f"Consistently high patient rating ({doc.average_rating:.1f}/5.0)")

            explanation = " · ".join(reasons)

            ranked_results.append({
                "doctor": doc.to_dict(),
                "composite_score": round(composite_score, 1),
                "open_slots_count": available_slots_count,
                "target_date": target_date.isoformat(),
                "explanation": explanation,
                "score_breakdown": {
                    "specialty_fit": round(spec_score),
                    "availability_fit": round(avail_score),
                    "time_preference_fit": round(time_pref_score),
                    "rating_fit": round(rating_score)
                }
            })

        # Rank descending by score
        ranked_results.sort(key=lambda x: x["composite_score"], reverse=True)
        return ranked_results[:max_results]
