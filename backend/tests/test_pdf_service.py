from app.services.pdf_service import pdf_service


def test_pdf_generation_valid_output(sample_itinerary):
    pdf_bytes = pdf_service.generate_trip_pdf(sample_itinerary)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 2000
    # Must start with standard PDF header
    assert pdf_bytes.startswith(b"%PDF")
    # Must end with PDF EOF marker or trailer
    assert b"%%EOF" in pdf_bytes
