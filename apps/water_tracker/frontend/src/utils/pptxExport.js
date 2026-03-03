import pptxgen from 'pptxgenjs';
import html2canvas from 'html2canvas';

/**
 * Export report elements to a PPTX presentation
 * @param {string} title - The title of the presentation
 * @param {string} dateRange - The date range of the report
 * @param {string[]} elementIds - Array of DOM element IDs to capture as slides
 * @param {string} filename - Base filename for the PPTX
 * @param {string} logo - Logo URL or Base64
 */
export const exportReportToPPTX = async (title, dateRange, elementIds, filename, logo) => {
    try {
        const pptx = new pptxgen();

        // PPT Layout (Standard 16:9)
        pptx.layout = 'LAYOUT_16x9';

        // Define Master Slide Theme
        pptx.defineSlideMaster({
            title: 'MASTER_SLIDE',
            background: { fill: 'F8FAFC' },
            objects: [
                { rect: { x: 0, y: 0, w: '100%', h: 0.5, fill: { color: '1E293B' } } }, // Header Block
                {
                    image: {
                        x: 0.4, y: 0.1, w: 0.3, h: 0.3,
                        path: logo,
                        sizing: { type: 'contain' }
                    }
                },
                {
                    text: {
                        text: title,
                        options: { x: 0.8, y: 0.1, w: 6, h: 0.3, fontSize: 13, bold: true, color: 'FFFFFF' }
                    }
                },
                {
                    text: {
                        text: 'STRATEGIC ANALYSIS',
                        options: { x: 7.5, y: 0.1, w: 2.2, h: 0.3, fontSize: 9, bold: true, color: '3B82F6', align: 'right' }
                    }
                },
                { rect: { x: 0, y: '96%', w: '100%', h: 0.25, fill: { color: 'F1F5F9' } } }, // Footer Block
                {
                    text: {
                        text: '© Rathinam Group | Confidential Report',
                        options: { x: 0.4, y: 5.4, w: 4, h: 0.15, fontSize: 7, color: '94A3B8' }
                    }
                }
            ],
            slideNumber: { x: 9.3, y: 5.4, fontSize: 8, color: '94A3B8' }
        });

        // 1. Add Title Slide
        const titleSlide = pptx.addSlide();
        titleSlide.background = { fill: '1E293B' }; // Dark theme for title

        // Stylized accents for title slide
        titleSlide.addShape(pptx.ShapeType.rect, { x: 0, y: '40%', w: '100%', h: '20%', fill: { color: '0F172A' } });

        if (logo) {
            titleSlide.addImage({
                path: logo,
                x: '45%', y: '15%', w: 1, h: 1,
                sizing: { type: 'contain' }
            });
        }

        titleSlide.addText(title, {
            x: 0, y: '43%', w: '100%', h: 0.8,
            fontSize: 44, bold: true, color: 'FFFFFF',
            align: 'center', margin: 0
        });

        titleSlide.addText(dateRange, {
            x: 0, y: '52%', w: '100%', h: 0.4,
            fontSize: 22, color: '3B82F6',
            align: 'center', bold: true
        });

        titleSlide.addText('RATHINAM WATER MANAGEMENT SYSTEM', {
            x: 0, y: '85%', w: '100%', h: 0.3,
            fontSize: 14, color: '64748B',
            align: 'center', spacing: 2
        });

        // 2. Add Slides for each element
        for (const id of elementIds) {
            const element = document.getElementById(id);
            if (!element) continue;

            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
                onclone: (clonedDoc) => {
                    clonedDoc.documentElement.classList.remove('dark');
                    const clonedElement = clonedDoc.getElementById(id);
                    if (clonedElement) {
                        clonedElement.style.padding = '0px';
                        clonedElement.style.backgroundColor = '#ffffff';
                        clonedElement.style.borderRadius = '0px';
                        clonedElement.style.boxShadow = 'none';

                        // EXPLICIT PPT READABILITY REINFORCEMENT
                        // Force all main table text to pure black to avoid any light rendering
                        clonedElement.querySelectorAll('td, th').forEach(cell => {
                            cell.style.color = '#000000';
                            cell.style.opacity = '1';
                            cell.style.fontWeight = '900'; // Make text fatter for PPT clarity
                        });

                        // Maintain distinction for drinking metrics if needed by targeting specific background indicators
                        clonedElement.querySelectorAll('td.bg-blue-100\\/40, td.bg-blue-50\\/20, th.bg-blue-700, th.bg-blue-600').forEach(cell => {
                            cell.style.color = '#000000'; // Even these should be black for max export readability
                        });

                        // Ensure category names are also sharp
                        clonedElement.querySelectorAll('span').forEach(span => {
                            if (span.innerText.length > 1) {
                                span.style.color = '#000000';
                                span.style.fontWeight = '900';
                            }
                        });
                    }
                }
            });

            const imgData = canvas.toDataURL('image/png');

            const slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });

            // Layout - Full bleed since the image now includes branding/titles
            const maxWidth = 10;
            const maxHeight = 5; // Reduced slightly to leave room for master slide master header/footer

            const imgAspectRatio = canvas.width / canvas.height;
            const slideAspectRatio = maxWidth / maxHeight;

            let finalWidth, finalHeight;
            if (imgAspectRatio > slideAspectRatio) {
                finalWidth = maxWidth;
                finalHeight = maxWidth / imgAspectRatio;
            } else {
                finalHeight = maxHeight;
                finalWidth = maxHeight * imgAspectRatio;
            }

            const xPos = (10 - finalWidth) / 2;
            const yPos = 0.5 + (maxHeight - finalHeight) / 2; // Offset from master header

            slide.addImage({
                data: imgData,
                x: xPos,
                y: yPos,
                w: finalWidth,
                h: finalHeight
            });
        }

        const finalFilename = `${filename}_${new Date().toISOString().split('T')[0]}.pptx`;
        await pptx.writeFile({ fileName: finalFilename });

        return { success: true };
    } catch (error) {
        console.error('PPTX Export Error:', error);
        return { success: false, error: error.message };
    }
};

