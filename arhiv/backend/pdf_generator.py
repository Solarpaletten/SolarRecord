from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from datetime import datetime
import os

# Register fonts with Cyrillic support
try:
    # Try to use DejaVu fonts (commonly available)
    pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
    pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
    FONT_AVAILABLE = True
except:
    print("Warning: DejaVu fonts not found. PDF may not display Cyrillic correctly.")
    FONT_AVAILABLE = False

def create_pdf(transcript_path: str, video_filename: str = None) -> str:
    """
    Create PDF report from transcript
    
    Args:
        transcript_path: Path to transcript file
        video_filename: Original video filename
    
    Returns:
        Path to generated PDF
    """
    try:
        # Generate PDF path
        pdf_path = transcript_path.replace("transcripts", "pdf").replace(".txt", ".pdf")
        
        # Read transcript
        with open(transcript_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Parse metadata from transcript
        lines = content.split("\n")
        language = "Unknown"
        confidence = "N/A"
        transcript_text = content
        
        if lines[0].startswith("[Language:"):
            language = lines[0].replace("[Language:", "").replace("]", "").strip()
            if len(lines) > 1 and lines[1].startswith("[Confidence:"):
                confidence = lines[1].replace("[Confidence:", "").replace("]", "").strip()
                transcript_text = "\n".join(lines[3:])  # Skip metadata lines
        
        # Create PDF
        doc = SimpleDocTemplate(
            pdf_path,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18
        )
        
        # Container for PDF elements
        elements = []
        
        # Styles
        styles = getSampleStyleSheet()
        
        # Custom styles with Cyrillic support
        if FONT_AVAILABLE:
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontName='DejaVuSans-Bold',
                fontSize=24,
                textColor=colors.HexColor('#2563eb'),
                spaceAfter=30,
                alignment=TA_CENTER
            )
            
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontName='DejaVuSans-Bold',
                fontSize=14,
                textColor=colors.HexColor('#1e40af'),
                spaceAfter=12
            )
            
            body_style = ParagraphStyle(
                'CustomBody',
                parent=styles['Normal'],
                fontName='DejaVuSans',
                fontSize=11,
                leading=16,
                alignment=TA_JUSTIFY,
                spaceAfter=12
            )
        else:
            title_style = styles['Title']
            heading_style = styles['Heading2']
            body_style = styles['Normal']
        
        # Title
        elements.append(Paragraph("Solar Recorder", title_style))
        elements.append(Paragraph("Transcript Report", heading_style))
        elements.append(Spacer(1, 0.3 * inch))
        
        # Metadata table
        metadata_data = [
            ["Recording Date:", datetime.now().strftime("%Y-%m-%d %H:%M:%S")],
            ["Detected Language:", language],
            ["Confidence:", confidence],
            ["Video File:", video_filename or "N/A"]
        ]
        
        metadata_table = Table(metadata_data, colWidths=[2*inch, 4*inch])
        metadata_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e0e7ff')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'DejaVuSans-Bold' if FONT_AVAILABLE else 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
        ]))
        
        elements.append(metadata_table)
        elements.append(Spacer(1, 0.5 * inch))
        
        # Transcript heading
        elements.append(Paragraph("Transcript", heading_style))
        elements.append(Spacer(1, 0.2 * inch))
        
        # Transcript content (split into paragraphs)
        paragraphs = transcript_text.strip().split("\n\n")
        for para in paragraphs:
            if para.strip():
                # Handle special characters for PDF
                para_text = para.replace("<", "&lt;").replace(">", "&gt;")
                elements.append(Paragraph(para_text, body_style))
                elements.append(Spacer(1, 0.1 * inch))
        
        # Footer
        elements.append(Spacer(1, 0.5 * inch))
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontName='DejaVuSans' if FONT_AVAILABLE else 'Helvetica',
            fontSize=9,
            textColor=colors.grey,
            alignment=TA_CENTER
        )
        elements.append(Paragraph("Generated by Solar Recorder | AI | IT | Solar", footer_style))
        
        # Build PDF
        doc.build(elements)
        
        print(f"PDF created: {pdf_path}")
        return pdf_path
        
    except Exception as e:
        print(f"PDF generation error: {str(e)}")
        # Create error PDF
        error_pdf_path = transcript_path.replace("transcripts", "pdf").replace(".txt", "_error.pdf")
        return error_pdf_path

def create_simple_pdf_fallback(transcript_path: str) -> str:
    """
    Fallback PDF generation without special fonts
    """
    from reportlab.pdfgen import canvas
    
    pdf_path = transcript_path.replace("transcripts", "pdf").replace(".txt", ".pdf")
    
    with open(transcript_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    c = canvas.Canvas(pdf_path, pagesize=A4)
    c.setFont("Helvetica", 12)
    
    # Simple text output
    y = 800
    for line in content.split("\n"):
        if y < 50:
            c.showPage()
            y = 800
        try:
            c.drawString(50, y, line[:100])  # Truncate long lines
            y -= 20
        except:
            pass  # Skip problematic characters
    
    c.save()
    return pdf_path
