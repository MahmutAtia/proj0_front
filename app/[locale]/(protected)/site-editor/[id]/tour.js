import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export const startSiteTour = (t) => {
    const driverObj = driver({
        showProgress: true,
        popoverClass: 'driverjs-theme',
        steps: [
            {
                element: null, // No element, show as modal
                popover: {
                    title: t('siteEditor.tour.intro.title'),
                    description: t('siteEditor.tour.intro.description'),
                    side: "center",
                    align: 'center'
                }
            },
            {
                element: '.tour-toolbar',
                popover: {
                    title: t('siteEditor.tour.toolbar.title'),
                    description: t('siteEditor.tour.toolbar.description'),
                    side: "bottom", 
                    align: 'start'
                
                }
            },
            {
                element: '.tour-global-settings',
                popover: {
                    title: t('siteEditor.tour.globalSettings.title'),
                    description: t('siteEditor.tour.globalSettings.description'),
                    side: "bottom",
                    align: 'start'
                }
            },
            {
                element: '.tour-global-history',
                popover: {
                    title: t('siteEditor.tour.globalHistory.title'),
                    description: t('siteEditor.tour.globalHistory.description'),
                    side: "bottom",
                    align: 'start'
                }
            },
            {
                element: '.tour-view-site',
                popover: {
                    title: t('siteEditor.tour.viewLiveSite.title'),
                    description: t('siteEditor.tour.viewLiveSite.description'),
                    side: "bottom",
                    align: 'end'
                }
            },
            {
                element: '.tour-save-button',
                popover: {
                    title: t('siteEditor.tour.saveChanges.title'),
                    description: t('siteEditor.tour.saveChanges.description'),
                    side: "bottom",
                    align: 'end'
                }
            },
            {
                element: '.tour-block-container',
                popover: {
                    title: t('siteEditor.tour.contentBlock.title'),
                    description: t('siteEditor.tour.contentBlock.description'),
                    side: "top",
                    align: 'center'
                },
               onHighlightStarted: () => {
  const overlay = document.querySelector('.tour-edit-overlay');
  if (overlay) {
    overlay.style.opacity = "1";
    overlay.style.pointerEvents = "auto";
  }
},
onHighlightEnded: () => {
  const overlay = document.querySelector('.tour-edit-overlay');
  if (overlay) {
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
  }
}
    },
            {
                element: '.tour-block-undo',
                popover: {
                    title: t('siteEditor.tour.undoBlock.title'),
                    description: t('siteEditor.tour.undoBlock.description'),
                    side: "left",
                    align: 'start'
                },
                onHighlightStarted: () => {
                    const block = document.querySelector('.tour-block-container');
                    if (block) {
                        block.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                    }
    }
},
            {
                element: '.tour-block-redo',
                popover: {
                    title: t('siteEditor.tour.redoBlock.title'),
                    description: t('siteEditor.tour.redoBlock.description'),
                    side: "left",
                    align: 'start'
                },
                onHighlightStarted: () => {
                    const block = document.querySelector('.tour-block-container');
                    if (block) {
                        block.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                    }
    }
},            {
                element: '.tour-edit-block',
                popover: {
                    title: t('siteEditor.tour.aiEditor.title'),
                    description: t('siteEditor.tour.aiEditor.description'),
                    side: "left",
                    align: 'start'
                },
                onHighlightStarted: () => {
                    const block = document.querySelector('.tour-block-container');
                    if (block) {
                        block.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                    }
    },
                onHighlighted: (element) => {
                    // Click the edit button to open the dialog for the next step
                    element.click();
                }
},            {
                element: '.tour-ai-dialog',
                popover: {
                    title: t('siteEditor.tour.aiAssistant.title'),
                    description: t('siteEditor.tour.aiAssistant.description'),
                    side: "top",
                    align: 'center'
                },
                onDeselected: () => {
                    // Close the dialog when moving to the next step
                    const closeButton = document.querySelector('.tour-ai-dialog .p-dialog-header-close');
                    if (closeButton) {
                        closeButton.click();
                    }
                }
            }
        ],
        onDestroyed: () => {
            localStorage.setItem('hasSeenSiteEditorTour', 'true');
        }
    });

    driverObj.drive();
};
// Usage example in a React component