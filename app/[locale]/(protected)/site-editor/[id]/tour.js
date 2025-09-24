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
                    title: "Welcome to the Site Editor",
                    description: "You are currently in the <b>Site Editor</b>. This is not your live website, but a safe place to make changes and preview them before publishing. Let's take a quick tour!",
                    side: "center",
                    align: 'center'
                }
            },
            {
                element: '.tour-toolbar',
                popover: {
                    title: "Site Editor Toolbar",
                    description: "This toolbar contains all the main actions for managing your website.",
                    side: "bottom", 
                    align: 'start'
                
                }
            },
            {
                element: '.tour-global-settings',
                popover: {
                    title: "Global Settings",
                    description: "Edit sitewide settings like general themes, fonts, and colors, site wide animations, and more.",
                    side: "bottom",
                    align: 'start'
                }
            },
            {
                element: '.tour-global-history',
                popover: {
                    title: "Global History",
                    description: "Undo and redo changes made to your global settings.",
                    side: "bottom",
                    align: 'start'
                }
            },
            {
                element: '.tour-view-site',
                popover: {
                    title: "View Live Site",
                    description: "Open your live website in a new tab to see how it looks to visitors. you can share this link with your friends, add it to your resume and start promoting your personal brand.",
                    side: "bottom",
                    align: 'end'
                }
            },
            {
                element: '.tour-save-button',
                popover: {
                    title: "Save Changes",
                    description: "Save all your edits. The button is disabled if there are no unsaved changes.",
                    side: "bottom",
                    align: 'end'
                }
            },
            {
                element: '.tour-block-container',
                popover: {
                    title: "Editable Content Block",
                    description: "Your website is made of these blocks. Hover over a block to see editing options.",
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
                    title: "Undo Block Change",
                    description: "You can undo any change you make to this specific block.",
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
                    title: "Redo Block Change",
                    description: "If you undo by mistake, you can redo the change right here.",
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
                    title: "AI-Powered Editor",
                    description: "Click the pencil to open the AI editor. Let's see what's inside.",
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
                    title: "AI Assistant",
                    description: "Here, you can write a prompt to change the block's content, style, or functionality. The AI will handle the code.",
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