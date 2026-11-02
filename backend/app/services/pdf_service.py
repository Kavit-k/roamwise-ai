import io
from typing import Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
)
from reportlab.pdfgen import canvas
from app.schemas.itinerary import Itinerary


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and print total page numbers: 'Page X of Y'
    along with a disclaimer footer on every page.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))  # Slate-500

        # Footer divider line
        self.setStrokeColor(colors.HexColor("#CBD5E1"))  # Slate-300
        self.setLineWidth(0.5)
        self.line(40, 36, letter[0] - 40, 36)

        # Footer Disclaimer & Branding
        footer_text = "Roamwise AI — Travel Itinerary. All costs and hours are AI estimates. Please verify prior to booking."
        self.drawString(40, 24, footer_text)

        # Page Number
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 40, 24, page_str)

        self.restoreState()


class PDFService:
    def __init__(self):
        # Color Palette matching Roamwise AI design
        self.brand_primary = colors.HexColor("#0F766E")    # Deep Teal
        self.brand_secondary = colors.HexColor("#134E4A")  # Deep Forest Green
        self.accent_warm = colors.HexColor("#F59E0B")      # Amber
        self.bg_light = colors.HexColor("#F8FAFC")         # Slate-50
        self.border_color = colors.HexColor("#E2E8F0")     # Slate-200
        self.text_dark = colors.HexColor("#0F172A")        # Slate-900
        self.text_muted = colors.HexColor("#475569")       # Slate-600

    def generate_trip_pdf(self, itinerary: Itinerary) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            leftMargin=40,
            rightMargin=40,
            topMargin=40,
            bottomMargin=50,
        )

        styles = getSampleStyleSheet()

        # Custom Typography Styles
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=26,
            textColor=self.brand_secondary,
            spaceAfter=6,
        )
        subtitle_style = ParagraphStyle(
            "DocSubTitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=11,
            leading=15,
            textColor=self.brand_primary,
            spaceAfter=14,
        )
        h2_style = ParagraphStyle(
            "DocH2",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=17,
            textColor=self.brand_secondary,
            spaceBefore=14,
            spaceAfter=8,
        )
        body_style = ParagraphStyle(
            "DocBody",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=14,
            textColor=self.text_dark,
        )
        act_title_style = ParagraphStyle(
            "ActTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=13,
            textColor=self.brand_primary,
        )
        small_style = ParagraphStyle(
            "DocSmall",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=12,
            textColor=self.text_muted,
        )
        bold_small = ParagraphStyle(
            "DocBoldSmall",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=12,
            textColor=self.text_dark,
        )

        story = []

        # 1. Header Banner
        header_table_data = [
            [
                Paragraph("<b>ROAMWISE AI</b> &bull; PERSONALIZED ITINERARY", subtitle_style),
                Paragraph(f"<b>Dates:</b> {itinerary.start_date} to {itinerary.end_date}", small_style),
            ]
        ]
        t_header = Table(header_table_data, colWidths=[330, 202])
        t_header.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ]))
        story.append(t_header)

        story.append(Paragraph(itinerary.title, title_style))
        story.append(
            Paragraph(
                f"<b>Destination:</b> {itinerary.destination}, {itinerary.country} &nbsp;|&nbsp; "
                f"<b>Duration:</b> {itinerary.days_count} Days &nbsp;|&nbsp; "
                f"<b>Travelers:</b> {itinerary.travelers} ({itinerary.travel_type.capitalize()})",
                subtitle_style,
            )
        )
        story.append(HRFlowable(width="100%", thickness=1.5, color=self.brand_primary, spaceBefore=2, spaceAfter=10))

        # 2. Executive Summary
        story.append(Paragraph("<b>Trip Summary</b>", h2_style))
        story.append(Paragraph(itinerary.summary, body_style))
        story.append(Spacer(1, 10))

        # 3. Budget Breakdown Table
        b = itinerary.budget_breakdown
        story.append(Paragraph("<b>Estimated Budget Breakdown</b>", h2_style))
        budget_data = [
            [
                Paragraph("<b>Category</b>", bold_small),
                Paragraph(f"<b>Estimated Amount ({b.currency})</b>", bold_small),
                Paragraph("<b>Planning Status</b>", bold_small),
            ],
            [Paragraph("Accommodation", small_style), Paragraph(f"{b.accommodation:,.2f}", small_style), Paragraph("Estimated area avg", small_style)],
            [Paragraph("Food & Dining", small_style), Paragraph(f"{b.food:,.2f}", small_style), Paragraph("Daily meals estimate", small_style)],
            [Paragraph("Local Transportation", small_style), Paragraph(f"{b.transportation:,.2f}", small_style), Paragraph("Transit / passes", small_style)],
            [Paragraph("Activities & Attractions", small_style), Paragraph(f"{b.activities:,.2f}", small_style), Paragraph("Entrance fees & tours", small_style)],
            [Paragraph("Miscellaneous Buffer", small_style), Paragraph(f"{b.miscellaneous:,.2f}", small_style), Paragraph("Contingency fund", small_style)],
            [
                Paragraph("<b>Estimated Total</b>", bold_small),
                Paragraph(f"<b>{b.estimated_total:,.2f} {b.currency}</b>", bold_small),
                Paragraph(
                    f"<b>{'On Track' if b.is_within_budget else 'Over Budget'}</b> (Target: {b.user_budget:,.2f} {b.currency})",
                    bold_small,
                ),
            ],
        ]
        t_budget = Table(budget_data, colWidths=[180, 160, 192])
        t_budget.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), self.bg_light),
            ("LINEBELOW", (0, 0), (-1, 0), 1, self.brand_primary),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("GRID", (0, 0), (-1, -1), 0.5, self.border_color),
            ("BACKGROUND", (0, -1), (-1, -1), self.bg_light),
        ]))
        story.append(t_budget)
        if b.budget_notes:
            story.append(Spacer(1, 4))
            story.append(Paragraph(f"<i>Note: {b.budget_notes}</i>", small_style))
        story.append(Spacer(1, 14))

        # 4. Day-by-Day Itinerary Plans
        story.append(Paragraph("<b>Day-by-Day Itinerary</b>", h2_style))

        for day in itinerary.days:
            day_elements = []
            day_header = [
                [
                    Paragraph(f"<b>Day {day.day_number}: {day.theme}</b>", ParagraphStyle("DayTitle", parent=h2_style, fontSize=11, textColor=colors.white)),
                    Paragraph(f"<b>Date:</b> {day.date}", ParagraphStyle("DayDate", parent=small_style, textColor=colors.white, alignment=2)),
                ]
            ]
            t_day_header = Table(day_header, colWidths=[360, 172])
            t_day_header.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), self.brand_primary),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]))
            day_elements.append(t_day_header)

            # Activities Table for this day
            acts = day.all_activities()
            if acts:
                act_rows = []
                for act in acts:
                    cost_str = f"{act.estimated_cost:,.2f} {b.currency}" if act.estimated_cost > 0 else "Free / Included"
                    time_info = f"<b>{act.time_slot.capitalize()}</b>"
                    if act.start_time:
                        time_info += f" &bull; {act.start_time}"
                    if act.duration_mins:
                        time_info += f" ({act.duration_mins}m)"

                    desc_full = act.description
                    if act.location_hint:
                        desc_full += f"<br/><i>Area: {act.location_hint}</i>"
                    if act.practical_tips:
                        desc_full += f"<br/><b>Tip:</b> {act.practical_tips}"

                    act_rows.append([
                        Paragraph(time_info, small_style),
                        Paragraph(f"<b>{act.title}</b><br/>{desc_full}", small_style),
                        Paragraph(cost_str, ParagraphStyle("CostAlign", parent=small_style, alignment=2)),
                    ])

                t_acts = Table(act_rows, colWidths=[110, 332, 90])
                t_acts.setStyle(TableStyle([
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("GRID", (0, 0), (-1, -1), 0.5, self.border_color),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]))
                day_elements.append(t_acts)

            # Day Notes / Transport / Meals
            notes_text = []
            if day.meals:
                m_parts = []
                if day.meals.breakfast:
                    m_parts.append(f"<b>Breakfast:</b> {day.meals.breakfast}")
                if day.meals.lunch:
                    m_parts.append(f"<b>Lunch:</b> {day.meals.lunch}")
                if day.meals.dinner:
                    m_parts.append(f"<b>Dinner:</b> {day.meals.dinner}")
                if m_parts:
                    notes_text.append(" &bull; ".join(m_parts))
            if day.transport_advice:
                notes_text.append(f"<b>Transport:</b> {day.transport_advice}")
            if day.practical_notes:
                notes_text.append(f"<b>Practical Note:</b> {day.practical_notes}")

            if notes_text:
                notes_block = "<br/>".join(notes_text)
                t_notes = Table([[Paragraph(notes_block, small_style)]], colWidths=[532])
                t_notes.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, -1), self.bg_light),
                    ("BOX", (0, 0), (-1, -1), 0.5, self.border_color),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]))
                day_elements.append(t_notes)

            day_elements.append(Spacer(1, 10))
            story.append(KeepTogether(day_elements))

        # 5. Accommodation Suggestions
        if itinerary.accommodations:
            story.append(Paragraph("<b>Suggested Neighborhoods & Accommodations</b>", h2_style))
            acc_rows = [
                [
                    Paragraph("<b>Area / Neighborhood</b>", bold_small),
                    Paragraph("<b>Category</b>", bold_small),
                    Paragraph(f"<b>Est. Nightly ({b.currency})</b>", bold_small),
                    Paragraph("<b>Recommendation & Booking Tips</b>", bold_small),
                ]
            ]
            for acc in itinerary.accommodations:
                acc_rows.append([
                    Paragraph(f"<b>{acc.area_name}</b>", small_style),
                    Paragraph(acc.category, small_style),
                    Paragraph(f"{acc.estimated_nightly_price:,.2f}", small_style),
                    Paragraph(f"{acc.reason}<br/><i>Tip: {acc.booking_tips}</i>", small_style),
                ])
            t_acc = Table(acc_rows, colWidths=[110, 85, 85, 252])
            t_acc.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), self.bg_light),
                ("GRID", (0, 0), (-1, -1), 0.5, self.border_color),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]))
            story.append(KeepTogether([t_acc, Spacer(1, 12)]))

        # 6. Practical Travel Guidance & Safety
        g = itinerary.guidance
        story.append(Paragraph("<b>Practical Travel Guidance</b>", h2_style))
        guidance_text = f"<b>Local Transportation:</b> {g.local_transport}<br/>"
        if g.packing_list:
            guidance_text += f"<b>Packing Essentials:</b> {', '.join(g.packing_list)}<br/>"
        if g.safety_tips:
            guidance_text += f"<b>Safety Tips:</b> {' &bull; '.join(g.safety_tips)}<br/>"
        if g.important_reminders:
            guidance_text += f"<b>Important Reminders:</b> {' &bull; '.join(g.important_reminders)}"

        t_guidance = Table([[Paragraph(guidance_text, small_style)]], colWidths=[532])
        t_guidance.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), self.bg_light),
            ("BOX", (0, 0), (-1, -1), 0.5, self.border_color),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(KeepTogether([t_guidance, Spacer(1, 10)]))

        # 7. Disclaimer Block
        story.append(
            Paragraph(
                f"<b>Important Disclaimer:</b> {itinerary.disclaimer} {g.unverified_details_disclaimer}",
                ParagraphStyle("Disclaimer", parent=small_style, textColor=self.text_muted, fontName="Helvetica-Oblique")
            )
        )

        # Build document with NumberedCanvas
        doc.build(story, canvasmaker=NumberedCanvas)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes


pdf_service = PDFService()
