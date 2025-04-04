// Add class to body initially to hide text until fonts load
document.body.classList.add('fonts-loading');

document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const galleryContainer = document.getElementById('gallery-container');
    const fullscreenContainer = document.getElementById('fullscreen-container');
    const fullscreenIframe = document.getElementById('fullscreen-iframe');
    const closeFullscreen = document.getElementById('close-fullscreen');
    const themeCheckbox = document.getElementById('theme-checkbox');
    const bodyElement = document.body;

    // --- Constants ---
    const artBasePath = 'artpieces/';
    const artBaseName = 'escapist_capital_variation_';
    const totalPieces = 100;

    // --- Basic Element Check ---
    if (!galleryContainer || !fullscreenContainer || !fullscreenIframe || !closeFullscreen || !themeCheckbox) {
        console.error('Required elements not found!');
        return;
    }

    // --- Theme Handling ---
    const applyTheme = (theme) => {
        if (theme === 'light') {
            bodyElement.classList.add('light-mode');
            themeCheckbox.checked = true;
        } else {
            bodyElement.classList.remove('light-mode');
            themeCheckbox.checked = false;
        }
    };

    const toggleTheme = () => {
        const newTheme = themeCheckbox.checked ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('galleryTheme', newTheme);
    };

    // Apply saved theme or default - we'll use this reference later for splash screen
    const savedTheme = localStorage.getItem('galleryTheme') || 'dark'; // Default to dark
    applyTheme(savedTheme);

    // Theme toggle listener
    themeCheckbox.addEventListener('change', toggleTheme);

    // --- Fullscreen Handling ---
    const openFullscreen = (filePath) => {
        fullscreenIframe.src = filePath;
        fullscreenContainer.style.display = 'flex'; // Use flex for centering
        // Timeout ensures display:flex is applied before adding class for transition
        setTimeout(() => {
            fullscreenContainer.classList.add('visible');
            bodyElement.style.overflow = 'hidden';
        }, 10); // Small delay
    };

    const closeFullscreenAction = () => {
        fullscreenContainer.classList.remove('visible');
        bodyElement.style.overflow = '';
        // Wait for transition to finish before hiding and clearing src
        fullscreenContainer.addEventListener('transitionend', () => {
            fullscreenContainer.style.display = 'none';
            fullscreenIframe.src = '';
        }, { once: true }); // Ensure listener runs only once
    };

    closeFullscreen.addEventListener('click', closeFullscreenAction);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && fullscreenContainer.classList.contains('visible')) {
            closeFullscreenAction();
        }
    });

    // --- Gallery Item Creation & Dynamic Layout ---
    const galleryItems = []; // Store items for IntersectionObserver

    // Define fixed distribution for a more irregular mosaic pattern with varied shapes
    const distribution = [
        // Aiming for ~99 items total before the special full-width final item
        // Row ~1-10 (Items 1-8)
        [ [1, 1, "wide-aspect"], [2, 1, "ultra-wide"], [1, 2, "tall-aspect"], [1, 1, ""], [2, 1, "short-wide"], [1, 1, "square-aspect"], [1, 2, "skinny"], [1, 1, ""] ], // 8 items
        // Row ~11-20 (Items 9-15)
        [ [2, 2, "tilted"], [1, 1, ""], [1, 3, "extra-tall"], [2, 1, "super-wide"], [1, 1, "tall-aspect"], [1, 1, ""], [2, 1, "wide-aspect"] ], // 7 items (Total 15)
        // Row ~21-30 (Items 16-21)
        [ [1, 1, ""], [3, 1, "cinema-wide"], [1, 2, "extra-tall"], [2, 1, "ultra-wide"], [1, 1, "square-aspect"], [1, 1, "wide-aspect"] ], // 6 items (Total 21)
        // Row ~31-40 (Items 22-27)
        [ [1, 2, "skinny"], [2, 2, ""], [1, 1, "tall-aspect"], [3, 1, "super-wide"], [1, 1, ""], [1, 1, "wide-aspect"] ], // 6 items (Total 27)
        // Row ~41-50 (Items 28-33)
        [ [2, 1, "ultra-wide"], [1, 1, ""], [1, 3, "super-tall"], [2, 1, "wide-aspect"], [1, 1, "tall-aspect"], [2, 1, "short-wide"] ], // 6 items (Total 33)
        // Row ~51-60 (Items 34-38)
        [ [1, 1, "square-aspect"], [2, 2, "tilted"], [1, 2, "extra-tall"], [3, 1, "cinema-wide"], [1, 1, ""] ], // 5 items (Total 38)
        // Row ~61-70 (Items 39-45)
        [ [1, 1, "wide-aspect"], [1, 2, "skinny"], [2, 1, "ultra-wide"], [1, 1, ""], [2, 2, ""], [1, 1, "tall-aspect"], [1, 1, "wide-aspect"] ], // 7 items (Total 45)
        // Row ~71-80 (Items 46-51) - Start ensuring more variety here
        [ [3, 1, "super-wide"], [1, 3, "extra-tall"], [2, 1, "wide-aspect"], [1, 1, ""], [1, 2, "tall-aspect"], [2, 1, "short-wide"] ], // 6 items (Total 51)
        // Row ~81-90 (Items 52-57) - More non-squares
        [ [2, 2, "tilted"], [1, 2, "skinny"], [3, 1, "cinema-wide"], [1, 1, "wide-aspect"], [2, 1, "ultra-wide"], [1, 2, "extra-tall"] ], // 6 items (Total 57)
        // Row ~91-99 (Items 58-64) - Focus on varied ratios
        [ [1, 3, "super-tall"], [2, 1, "wide-aspect"], [1, 1, "tall-aspect"], [3, 1, "super-wide"], [1, 2, "skinny"], [2, 1, "ultra-wide"], [1, 1, ""] ], // 7 items (Total 64)
        // Row ~10 (Items 65-70)
        [ [2, 1, "short-wide"], [1, 1, "square-aspect"], [1, 2, "tall-aspect"], [3, 2, "panoramic"], [1, 1, "wide-aspect"], [2, 1, "ultra-wide"] ], // 6 items (Total 70)
        // Row ~11 (Items 71-76)
        [ [1, 2, "extra-tall"], [2, 2, ""], [1, 1, "tall-aspect"], [3, 1, "cinema-wide"], [1, 2, "skinny"], [1, 1, ""] ], // 6 items (Total 76)
        // Row ~12 (Items 77-82)
        [ [2, 1, "wide-aspect"], [1, 3, "super-tall"], [2, 1, "ultra-wide"], [1, 1, "square-aspect"], [3, 1, "super-wide"], [1, 1, ""] ], // 6 items (Total 82)
        // Row ~13 (Items 83-89)
        [ [1, 2, "tall-aspect"], [2, 1, "short-wide"], [1, 1, "wide-aspect"], [2, 2, "tilted"], [1, 2, "extra-tall"], [2, 1, "ultra-wide"], [1, 1, ""] ], // 7 items (Total 89)
        // Row ~14 (Items 90-99)
        [ [3, 1, "cinema-wide"], [1, 2, "skinny"], [2, 1, "wide-aspect"], [1, 1, ""], [1, 3, "super-tall"], [2, 1, "ultra-wide"], [1, 1, "tall-aspect"], [2, 2, ""], [1, 1, "wide-aspect"], [1, 1, ""] ] // 10 items (Total 99)
    ];
    
    // Calculate total items in the distribution
    let totalItemsInDistribution = 0;
    distribution.forEach(row => {
        totalItemsInDistribution += row.length;
    });
    console.log(`Distribution contains ${totalItemsInDistribution} items for ${totalPieces} art pieces`);
    
    // Ensure we have exactly 100 items
    if (totalItemsInDistribution < totalPieces) {
        // Add more single items to distribution
        const additionalItems = totalPieces - totalItemsInDistribution;
        const lastRowIndex = distribution.length - 1;
        distribution[lastRowIndex - 1].push(...Array(additionalItems).fill([1, 1, ""]));
        console.log(`Added ${additionalItems} additional items to reach ${totalPieces} total`);
    } else if (totalItemsInDistribution > totalPieces) {
        console.warn(`Distribution has ${totalItemsInDistribution} items, but we only need ${totalPieces}. Adjusting...`);
        // Remove some 1x1 items
        let removed = 0;
        let excessItems = totalItemsInDistribution - totalPieces;
        for (let i = distribution.length - 2; i >= 0 && removed < excessItems; i--) {
            for (let j = distribution[i].length - 1; j >= 0 && removed < excessItems; j--) {
                if (distribution[i][j][0] === 1 && distribution[i][j][1] === 1) {
                    distribution[i].splice(j, 1);
                    removed++;
                }
            }
        }
        console.log(`Removed ${removed} excess items to reach ${totalPieces} total`);
    }
    
    // Flatten the distribution for easier processing
    const flatDistribution = distribution.flat();
    
    // Batch rendering variables
    const BATCH_SIZE = 20; // Reasonable batch size
    let currentBatch = 0;
    let lastLoadedItem = 0;
    // Function to create a gallery item
    const createGalleryItem = (i) => {
        // Skip if this item already exists
        if (document.querySelector(`.gallery-item[data-art-index="${i}"]`)) {
            console.log(`Item ${i} already exists, skipping creation`);
            return;
        }
        
        const artFileName = `${artBaseName}${i}.html`;
        const artFilePath = `${artBasePath}${artFileName}`;
        
        // Special handling for the last piece - make it a full-width footer
        if (i === totalPieces) {
            const galleryItem = document.createElement('div');
            galleryItem.classList.add('gallery-item', 'full-width-item');
            galleryItem.dataset.artIndex = i; // Set data attribute for tracking
            
            const iframe = document.createElement('iframe');
            iframe.src = artFilePath;
            iframe.title = `Escapist Capital Variation ${i}`;
            iframe.loading = 'lazy';
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
            
            const textOverlay = document.createElement('div');
            textOverlay.classList.add('text-overlay');
            textOverlay.textContent = i;
            
            const clickOverlay = document.createElement('div');
            clickOverlay.classList.add('click-overlay');
            clickOverlay.addEventListener('click', () => openFullscreen(artFilePath));
            
            galleryItem.appendChild(iframe);
            galleryItem.appendChild(textOverlay);
            galleryItem.appendChild(clickOverlay);
            galleryContainer.appendChild(galleryItem);
            galleryItems.push(galleryItem);
            console.log(`Created full-width gallery item #${i}`);
            return; // Skip the regular item creation
        }
        
        // Get the size from the distribution
        const itemIndex = Math.min(i - 1, flatDistribution.length - 1);
        const [width, height, aspectClass] = flatDistribution[itemIndex];
        
        const galleryItem = document.createElement('div');
        galleryItem.classList.add('gallery-item');
        galleryItem.dataset.artIndex = i; // Set data attribute for tracking
        
        // Apply width and height classes
        if (width === 2 && height === 2) {
            galleryItem.classList.add('span-2x2');
        } else if (width === 2 && height === 1) {
            galleryItem.classList.add('span-col-2');
        } else if (width === 1 && height === 2) {
            galleryItem.classList.add('span-row-2');
        } else if (width === 3 && height === 1) {
            galleryItem.classList.add('span-col-3');
        } else if (width === 1 && height === 3) {
            galleryItem.classList.add('span-row-3');
        }
        
        // Apply aspect ratio variation class if specified
        if (aspectClass) {
            galleryItem.classList.add(aspectClass);
        }
        
        // Add staggered animation delay for loading effect
        galleryItem.style.setProperty('--animation-delay', `${(i % 20) * 0.03}s`);

        // Create placeholder initially
        const placeholder = document.createElement('div');
        placeholder.classList.add('placeholder');
        placeholder.textContent = i; // Display number in placeholder

        // Store the actual iframe source in a data attribute
        galleryItem.dataset.src = artFilePath;

        const textOverlay = document.createElement('div');
        textOverlay.classList.add('text-overlay');
        textOverlay.textContent = i;

        const clickOverlay = document.createElement('div');
        clickOverlay.classList.add('click-overlay');
        // Note: The click listener now needs the path from the dataset
        clickOverlay.addEventListener('click', () => {
            const path = galleryItem.dataset.src;
            if (path) {
                openFullscreen(path);
            }
        });

        galleryItem.appendChild(placeholder); // Add placeholder first
        galleryItem.appendChild(textOverlay);
        galleryItem.appendChild(clickOverlay);
        galleryContainer.appendChild(galleryItem);
        galleryItems.push(galleryItem); // Add to array for IntersectionObserver
    };

    // --- Intersection Observer Setup ---
    const observerOptions = {
        root: null, // Use the viewport as the root
        rootMargin: '0px 0px 200px 0px', // Load images 200px before they enter viewport
        threshold: 0.01 // Trigger when even 1% is visible
    };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const galleryItem = entry.target;
                const iframeSrc = galleryItem.dataset.src;

                if (iframeSrc && !galleryItem.querySelector('iframe')) { // Check if iframe already exists
                    console.log(`Loading iframe for item #${galleryItem.dataset.artIndex}`);
                    const iframe = document.createElement('iframe');
                    iframe.src = iframeSrc;
                    iframe.title = `Escapist Capital Variation ${galleryItem.dataset.artIndex}`;
                    iframe.loading = 'lazy'; // Still useful as a fallback
                    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
                    iframe.classList.add('loading'); // Add class for potential styling

                    // Remove placeholder and add iframe
                    const placeholder = galleryItem.querySelector('.placeholder');
                    if (placeholder) {
                        placeholder.remove();
                    }
                    galleryItem.insertBefore(iframe, galleryItem.querySelector('.text-overlay')); // Insert before text overlay

                    iframe.onload = () => {
                        iframe.classList.remove('loading');
                        iframe.classList.add('loaded'); // Add loaded class
                    };
                    iframe.onerror = () => {
                        console.error(`Failed to load iframe: ${iframeSrc}`);
                        iframe.classList.remove('loading');
                        // Optionally add an error state style
                    };

                    // Stop observing this item once loaded
                    observer.unobserve(galleryItem);
                }
            }
        });
    };

    const galleryObserver = new IntersectionObserver(observerCallback, observerOptions);

    // --- Initial Gallery Population ---
    console.log("Clearing existing gallery items and creating placeholders...");
    galleryContainer.innerHTML = ''; // Clear everything
    galleryItems.length = 0; // Clear the gallery items array

    // Create all gallery items with placeholders
    for (let i = 1; i <= totalPieces; i++) {
        createGalleryItem(i);
    }

    // Observe all created gallery items
    galleryItems.forEach(item => {
        galleryObserver.observe(item);
    });

    console.log(`Created ${totalPieces} placeholders. IntersectionObserver is watching.`);

    // --- Font Loading Detection ---
    if ('fonts' in document) {
        document.fonts.ready.then(() => {
            document.body.classList.remove('fonts-loading');
        }).catch(error => {
            console.error('Font loading error:', error);
            document.body.classList.remove('fonts-loading'); // Remove even on error
        });
    } else {
        // Fallback for browsers without document.fonts support
        setTimeout(() => {
            document.body.classList.remove('fonts-loading');
        }, 500); // Assume fonts loaded after 500ms
    }
});
