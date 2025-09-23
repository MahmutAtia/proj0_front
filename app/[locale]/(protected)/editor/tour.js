import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export const startTour = (t) => {
    const driverObj = driver({
        showProgress: true,
        popoverClass: 'driverjs-theme',
        steps: [
            // Group 1: Sidebar
            {
                element: '.tour-sidebar',
                popover: {
                    title: t('resumeEditor.tour.sidebar.navigation.title'),
                    description: t('resumeEditor.tour.sidebar.navigation.description'),
                    side: "right",
                    align: 'start'
                }
            },
            {
                element: '.tour-section-item',
                popover: {
                    title: t('resumeEditor.tour.sidebar.sectionItem.title'),
                    description: t('resumeEditor.tour.sidebar.sectionItem.description'),
                    side: "right",
                    align: 'start'
                }
            },
            {
                element: '.tour-drag-handle',
                popover: {
                    title: t('resumeEditor.tour.sidebar.dragHandle.title'),
                    description: t('resumeEditor.tour.sidebar.dragHandle.description'),
                    side: "right",
                    align: 'start'
                }
            },
            {
                element: '.tour-visibility-toggle',
                popover: {
                    title: t('resumeEditor.tour.sidebar.visibilityToggle.title'),
                    description: t('resumeEditor.tour.sidebar.visibilityToggle.description'),
                    side: "right",
                    align: 'start'
                }
            },

            // Group 2: Main Editor Actions (Focus on Experience section)
            {
                element: '#section-experience',
                popover: {
                    title: t('resumeEditor.tour.editor.overview.title'),
                    description: t('resumeEditor.tour.editor.overview.description'),
                    side: "top",
                    align: 'center'
                },
                onHighlightStarted: (element) => {
                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            },
            {
                element: '#section-experience .tour-add-section',
                popover: {
                    title: t('resumeEditor.tour.editor.addSection.title'),
                    description: t('resumeEditor.tour.editor.addSection.description'),
                    side: "left",
                    align: 'start'
                }
            },
            {
                element: '#section-experience .tour-edit-section',
                popover: {
                    title: t('resumeEditor.tour.editor.editSection.title'),
                    description: t('resumeEditor.tour.editor.editSection.description'),
                    side: "left",
                    align: 'start'
                },
                onHighlighted: (element) => {
                    // Open the dialog for the next step
                    element.click();
                }
            },
            {
                element: '.resume-editor-dialog .tour-ai-edit',
                popover: {
                    title: t('resumeEditor.tour.editor.aiEdit.title'),
                    description: t('resumeEditor.tour.editor.aiEdit.description'),
                    side: "top",
                    align: 'center'
                }
            },
            {
                element: '.resume-editor-dialog .tour-voice-input',
                popover: {
                    title: t('resumeEditor.tour.editor.voiceInput.title'),
                    description: t('resumeEditor.tour.editor.voiceInput.description'),
                    side: "top",
                    align: 'center'
                },
                onDeselected: () => {
                    // Close the dialog after explaining it
                    const closeButton = document.querySelector('.resume-editor-dialog .p-dialog-header-close');
                    if (closeButton) {
                        closeButton.click();
                    }
                }
            },

            // Group 3: Top Bar Actions
            {
                element: '.tour-save-button',
                popover: {
                    title: t('resumeEditor.tour.topbar.saveButton.title'),
                    description: t('resumeEditor.tour.topbar.saveButton.description'),
                    side: "bottom",
                    align: 'center'
                }
            },
            {
                element: '.tour-export-button',
                popover: {
                    title: t('resumeEditor.tour.topbar.exportButton.title'),
                    description: t('resumeEditor.tour.topbar.exportButton.description'),
                    side: "bottom",
                    align: 'center'
                }
            },
            {
                element: '.tour-generate-document',
                popover: {
                    title: t('resumeEditor.tour.topbar.generateDocument.title'),
                    description: t('resumeEditor.tour.topbar.generateDocument.description'),
                    side: "bottom",
                    align: 'center'
                }
            },
            {
                element: '.tour-generate-document .p-splitbutton-menubutton',
                popover: {
                    title: t('resumeEditor.tour.topbar.actionsDropdown.title'),
                    description: t('resumeEditor.tour.topbar.actionsDropdown.description'),
                    side: "bottom",
                    align: 'end'
                },
                onHighlighted: (element) => {
                    // Open the dropdown menu
                    element.click();
                },
                onDeselected: (element) => {
                    // Close the dropdown menu
                    element.click();
                }
            },
            {
                element: '.tour-back-button',
                popover: {
                    title: t('resumeEditor.tour.topbar.backButton.title'),
                    description: t('resumeEditor.tour.topbar.backButton.description'),
                    side: "bottom",
                    align: 'start'
                }
            }
        ],
        onDestroyed: () => {
            // Ensure any open dialogs or menus are closed if the tour is exited prematurely
            const closeButton = document.querySelector('.resume-editor-dialog .p-dialog-header-close');
            if (closeButton) {
                closeButton.click();
            }
            localStorage.setItem('hasSeenResumeEditorTour', 'true');
        }
    });

    driverObj.drive();
};