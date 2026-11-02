from app.services.itinerary_service import itinerary_service
from app.schemas.itinerary import Activity


def test_add_activity(sample_itinerary):
    initial_act_count = len(sample_itinerary.days[0].morning)
    initial_budget = sample_itinerary.budget_breakdown.estimated_total

    new_act = Activity(
        title="Fushimi Inari Early Hike",
        time_slot="morning",
        start_time="07:00 AM",
        duration_mins=120,
        description="Walk through thousands of vermilion torii gates.",
        estimated_cost=0.0,
        category="nature"
    )

    itinerary_service.add_activity(sample_itinerary, day_number=1, activity=new_act)
    assert len(sample_itinerary.days[0].morning) == initial_act_count + 1
    assert sample_itinerary.days[0].morning[-1].title == "Fushimi Inari Early Hike"


def test_update_activity(sample_itinerary):
    act_to_update = sample_itinerary.days[0].morning[0]
    act_id = act_to_update.id

    updates = Activity(
        id=act_id,
        title="VIP Guided Temple Tour",
        time_slot="morning",
        start_time="08:30 AM",
        duration_mins=120,
        description="Private monk meditation session.",
        estimated_cost=150.0  # Increased from 15.0
    )

    updated_itinerary = itinerary_service.update_activity(
        sample_itinerary, day_number=1, activity_id=act_id, updates=updates
    )

    day1 = updated_itinerary.days[0]
    assert day1.morning[0].title == "VIP Guided Temple Tour"
    assert day1.morning[0].estimated_cost == 150.0
    # Check budget updated
    assert updated_itinerary.budget_breakdown.activities > 0


def test_delete_activity(sample_itinerary):
    act_to_delete = sample_itinerary.days[0].morning[0]
    act_id = act_to_delete.id
    initial_count = len(sample_itinerary.days[0].morning)

    itinerary_service.delete_activity(sample_itinerary, day_number=1, activity_id=act_id)
    assert len(sample_itinerary.days[0].morning) == initial_count - 1


def test_reorder_activities(sample_itinerary):
    day = sample_itinerary.days[0]
    m_act = day.morning[0]
    a_act = day.afternoon[0]

    # Reorder IDs
    reordered_ids = [a_act.id, m_act.id]
    itinerary_service.reorder_activities(sample_itinerary, day_number=1, activity_ids=reordered_ids)

    # Both activities should still be present
    all_current_ids = [a.id for a in sample_itinerary.days[0].all_activities()]
    assert m_act.id in all_current_ids
    assert a_act.id in all_current_ids


def test_budget_exceeded_warning(sample_itinerary):
    # Set user budget lower than estimated total
    sample_itinerary.budget_breakdown.user_budget = 1000.0
    itinerary_service.recalculate_budget(sample_itinerary)

    b = sample_itinerary.budget_breakdown
    assert not b.is_within_budget
    assert b.budget_difference < 0
    assert "Warning" in b.budget_notes
