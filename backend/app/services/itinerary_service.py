from typing import List, Optional
from fastapi import HTTPException, status
from app.schemas.itinerary import Itinerary, DayPlan, Activity
import uuid


class ItineraryService:
    @staticmethod
    def recalculate_budget(itinerary: Itinerary) -> Itinerary:
        """
        Recalculates activity costs and overall budget breakdown totals.
        Updates difference and warning flags.
        """
        activity_sum = sum(
            act.estimated_cost
            for day in itinerary.days
            for act in day.all_activities()
        )
        b = itinerary.budget_breakdown
        b.activities = round(activity_sum, 2)
        b.estimated_total = round(
            b.accommodation + b.food + b.transportation + b.activities + b.miscellaneous, 2
        )
        b.is_within_budget = b.estimated_total <= b.user_budget
        b.budget_difference = round(b.user_budget - b.estimated_total, 2)
        if not b.is_within_budget:
            b.budget_notes = (
                f"Warning: Estimated expenses ({b.estimated_total:,.2f} {b.currency}) exceed your "
                f"target budget ({b.user_budget:,.2f} {b.currency}) by {abs(b.budget_difference):,.2f} {b.currency}."
            )
        else:
            b.budget_notes = (
                f"On track: You have {b.budget_difference:,.2f} {b.currency} remaining within your planned budget."
            )
        return itinerary

    @staticmethod
    def find_day(itinerary: Itinerary, day_number: int) -> DayPlan:
        for day in itinerary.days:
            if day.day_number == day_number:
                return day
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Day {day_number} not found in this itinerary."
        )

    def add_activity(self, itinerary: Itinerary, day_number: int, activity: Activity) -> Itinerary:
        day = self.find_day(itinerary, day_number)
        if not activity.id:
            activity.id = str(uuid.uuid4())

        slot = activity.time_slot.lower()
        if slot == "morning":
            day.morning.append(activity)
        elif slot == "afternoon":
            day.afternoon.append(activity)
        elif slot == "evening":
            day.evening.append(activity)
        else:
            day.afternoon.append(activity)

        return self.recalculate_budget(itinerary)

    def update_activity(
        self, itinerary: Itinerary, day_number: int, activity_id: str, updates: Activity
    ) -> Itinerary:
        day = self.find_day(itinerary, day_number)
        found = False

        # Look in morning, afternoon, evening
        for slot_name in ["morning", "afternoon", "evening"]:
            activities: List[Activity] = getattr(day, slot_name)
            for i, act in enumerate(activities):
                if act.id == activity_id:
                    # Check if slot changed
                    new_slot = updates.time_slot.lower()
                    if new_slot == slot_name:
                        activities[i] = updates
                        updates.id = activity_id
                    else:
                        # Remove from current slot and append to new slot
                        activities.pop(i)
                        updates.id = activity_id
                        target_list: List[Activity] = getattr(day, new_slot)
                        target_list.append(updates)
                    found = True
                    break
            if found:
                break

        if not found:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Activity with ID '{activity_id}' not found in Day {day_number}."
            )

        return self.recalculate_budget(itinerary)

    def delete_activity(self, itinerary: Itinerary, day_number: int, activity_id: str) -> Itinerary:
        day = self.find_day(itinerary, day_number)
        found = False

        for slot_name in ["morning", "afternoon", "evening"]:
            activities: List[Activity] = getattr(day, slot_name)
            for i, act in enumerate(activities):
                if act.id == activity_id:
                    activities.pop(i)
                    found = True
                    break
            if found:
                break

        if not found:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Activity with ID '{activity_id}' not found in Day {day_number}."
            )

        return self.recalculate_budget(itinerary)

    def reorder_activities(
        self, itinerary: Itinerary, day_number: int, activity_ids: List[str]
    ) -> Itinerary:
        day = self.find_day(itinerary, day_number)
        all_acts = {act.id: act for act in day.all_activities()}

        # Verify all provided IDs exist
        missing = [aid for aid in activity_ids if aid not in all_acts]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown activity IDs in reorder request: {missing}"
            )

        # Distribute into morning/afternoon/evening according to their slots in ordered sequence
        reordered_all = [all_acts[aid] for aid in activity_ids]
        
        day.morning = [a for a in reordered_all if a.time_slot == "morning"]
        day.afternoon = [a for a in reordered_all if a.time_slot == "afternoon"]
        day.evening = [a for a in reordered_all if a.time_slot == "evening"]

        return itinerary

    def replace_day(self, itinerary: Itinerary, day_number: int, new_day: DayPlan) -> Itinerary:
        found = False
        for i, day in enumerate(itinerary.days):
            if day.day_number == day_number:
                new_day.day_number = day_number
                new_day.date = day.date
                itinerary.days[i] = new_day
                found = True
                break

        if not found:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Day {day_number} not found to replace."
            )

        return self.recalculate_budget(itinerary)


itinerary_service = ItineraryService()
