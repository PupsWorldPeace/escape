// Add class to body initially to hide text until fonts load
document.body.classList.add('fonts-loading');

document.addEventListener('DOMContentLoaded', () => {
    // --- Get Splash Screen Element ---
    const splashScreen = document.getElementById('splash-screen');
    let splashScreenRemoved = false; // Track if splash screen has been removed
    
    // --- Matrix Canvas Elements & Setup ---
    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');
    let animationFrameId; // To control the animation loop

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

    // --- Matrix Animation Logic ---
    let frameCount = 0; // Counter to slow down animation
    const animationSpeed = 4; // Draw every N frames (higher = slower)
    let matrixConfig = {
        chars: "10", // Only use 1s and 0s
        fontSize: 14,
        fontFamily: 'monospace',
        textColorDark: '#00dd00', // Adjusted green slightly
        textColorLight: '#333333', // Dark grey for light mode
        bgColorDark: 'rgba(0, 0, 0, 0.04)', // Slightly slower fade for dark
        bgColorLight: 'rgba(255, 255, 255, 0.06)', // Slightly slower fade for light
        columns: 0,
        drops: [],
        textColor: '', // Will be set by theme
        bgColor: ''    // Will be set by theme
    };

    const setupMatrix = () => {
        frameCount = 0; // Reset frame count on setup
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        matrixConfig.columns = Math.floor(canvas.width / matrixConfig.fontSize);
        matrixConfig.drops = [];
        for (let x = 0; x < matrixConfig.columns; x++) {
            matrixConfig.drops[x] = 1;
        }
        // Set initial theme colors
        const currentTheme = bodyElement.classList.contains('light-mode') ? 'light' : 'dark';
        updateMatrixTheme(currentTheme);
    };

    const drawMatrix = () => {
        animationFrameId = requestAnimationFrame(drawMatrix); // Request next frame immediately

        frameCount++;
        if (frameCount < animationSpeed) {
            return; // Skip drawing this frame to slow down animation
        }
        frameCount = 0; // Reset frame counter

        // Set background with transparency for fading effect
        ctx.fillStyle = matrixConfig.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = matrixConfig.textColor;
        ctx.font = `${matrixConfig.fontSize}px ${matrixConfig.fontFamily}`;

        for (let i = 0; i < matrixConfig.drops.length; i++) {
            const text = matrixConfig.chars[Math.floor(Math.random() * matrixConfig.chars.length)];
            ctx.fillText(text, i * matrixConfig.fontSize, matrixConfig.drops[i] * matrixConfig.fontSize);

            // Sending the drop back to the top randomly after it has crossed the screen
            // Adding randomness to the reset to make the rain look more chaotic
            if (matrixConfig.drops[i] * matrixConfig.fontSize > canvas.height && Math.random() > 0.975) {
                matrixConfig.drops[i] = 0;
            }
            matrixConfig.drops[i]++;
        }
    };

    const updateMatrixTheme = (theme) => {
        if (theme === 'light') {
            matrixConfig.textColor = matrixConfig.textColorLight;
            matrixConfig.bgColor = matrixConfig.bgColorLight;
        } else {
            matrixConfig.textColor = matrixConfig.textColorDark;
            matrixConfig.bgColor = matrixConfig.bgColorDark;
        }
    };

    // Initial setup and start animation
    setupMatrix();
    drawMatrix();

    // Handle window resize for matrix
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            cancelAnimationFrame(animationFrameId); // Stop current animation
            setupMatrix(); // Recalculate columns and drops
            drawMatrix(); // Restart animation
        }, 250); // Debounce resize event
    });

    // --- Matrix Animation Optimization ---
    // Pause matrix only when window not visible
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationFrameId);
        } else {
            drawMatrix();
        }
    });

    // --- Theme Handling ---
    const applyTheme = (theme) => {
        if (theme === 'light') {
            bodyElement.classList.add('light-mode');
            themeCheckbox.checked = true;
        } else {
            bodyElement.classList.remove('light-mode');
            themeCheckbox.checked = false;
        }
        updateMatrixTheme(theme); // Update canvas colors on theme change
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
        [ [3, 1, "cinema-wide"], [1, 2, "skinny"], [2, 1, "wide-aspect"], [1, 1, ""], [1, 3, "super-tall"], [2, 1, "ultra-wide"], [1, 1, "tall-aspect"], [2, 2, ""], [1, 1, "wide-aspect"], [1, 1, ""] ] 
    ];
    
    // Calculate total items in the distribution
    let totalItemsInDistribution = 0;
    distribution.forEach(row => {
        totalItemsInDistribution += row.length;
    });
    
    // Ensure we have exactly 100 items
    if (totalItemsInDistribution < totalPieces) {
        // Add more single items to distribution
        const additionalItems = totalPieces - totalItemsInDistribution;
        const lastRowIndex = distribution.length - 1;
        distribution[lastRowIndex - 1].push(...Array(additionalItems).fill([1, 1, ""]));
    } else if (totalItemsInDistribution > totalPieces) {
        console.warn(`Distribution has ${totalItemsInDistribution} items, but we only need ${totalPieces}. Adjusting...`);
        // Remove some 1x1 items
        const excessItems = totalItemsInDistribution - totalPieces;
        let removed = 0;
        for (let i = distribution.length - 2; i >= 0 && removed < excessItems; i--) {
            for (let j = distribution[i].length - 1; j >= 0 && removed < excessItems; j--) {
                if (distribution[i][j][0] === 1 && distribution[i][j][1] === 1) {
                    distribution[i].splice(j, 1);
                    removed++;
                }
            }
        }
    }
    
    // Flatten the distribution for easier processing
    const flatDistribution = distribution.flat();
    
    // Batch rendering variables
    const BATCH_SIZE = 30; // Increased from 20 to 30 for more aggressive preloading
    let currentBatch = 0;
    let lastLoadedItem = 0;
    let isLoading = false;
    let initialBatchLoaded = false; // Track if first batch is loaded
    let isScrolling = false; // Track scrolling state
    
    // Function to load a batch of items
    const loadNextBatch = () => {
        if (isLoading || lastLoadedItem >= totalPieces) return;
        
        isLoading = true;
        const startItem = lastLoadedItem + 1;
        const endItem = Math.min(lastLoadedItem + BATCH_SIZE, totalPieces);
        
        for (let i = startItem; i <= endItem; i++) {
            createGalleryItem(i);
        }
        
        lastLoadedItem = endItem;
        currentBatch++;
        isLoading = false;
        
        // Hide splash screen after first batch loads, but only once
        if (currentBatch === 1 && !initialBatchLoaded && !splashScreenRemoved) {
            initialBatchLoaded = true;
            // Add a longer delay to ensure items have rendered and give more loading time
            setTimeout(() => {
                splashScreen.classList.add('hidden');
                splashScreenRemoved = true; // Mark as removed to prevent reappearing
            }, 2500); // Increased from 800ms to 2500ms for longer splash screen
        }
    };

    // Function to create a gallery item
    const createGalleryItem = (i) => {
        const artFileName = `${artBaseName}${i}.html`;
        const artFilePath = `${artBasePath}${artFileName}`;
        
        // Special handling for the last piece - make it a full-width footer
        if (i === totalPieces) {
            const galleryItem = document.createElement('div');
            galleryItem.classList.add('gallery-item', 'full-width-item');
            
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
            return; // Skip the regular item creation
        }
        
        // Get the size from the distribution
        const itemIndex = Math.min(i - 1, flatDistribution.length - 1);
        const [width, height, aspectClass] = flatDistribution[itemIndex];
        
        const galleryItem = document.createElement('div');
        galleryItem.classList.add('gallery-item');
        
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
        
        // Create placeholder first, iframe will be loaded on intersection
        const placeholder = document.createElement('div');
        placeholder.classList.add('placeholder');
        placeholder.textContent = i;
        
        const textOverlay = document.createElement('div');
        textOverlay.classList.add('text-overlay');
        textOverlay.textContent = i;
        
        const clickOverlay = document.createElement('div');
        clickOverlay.classList.add('click-overlay');
        clickOverlay.dataset.artPath = artFilePath;
        clickOverlay.addEventListener('click', () => openFullscreen(artFilePath));
        
        galleryItem.appendChild(placeholder);
        galleryItem.appendChild(textOverlay);
        galleryItem.appendChild(clickOverlay);
        galleryContainer.appendChild(galleryItem);
        galleryItems.push(galleryItem);

        // Store art path for lazy loading
        galleryItem.dataset.artPath = artFilePath;
        galleryItem.dataset.artIndex = i;
    };

    // We'll delay this until after fonts are loaded
    // and show splash screen in the meantime

    // --- Intersection Observer for Scroll Animations and Lazy Loading ---
    if ('IntersectionObserver' in window) {
        // Observer for loading more batches when nearing the end
        const batchObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !isLoading) {
                    loadNextBatch();
                }
            });
        }, {
            rootMargin: '1200px 0px 1200px 0px', // Greatly increased from 800px to 1200px for extremely early loading
        });
        
        // Add sentinel element for infinite scroll
        const sentinel = document.createElement('div');
        sentinel.id = 'sentinel';
        sentinel.style.height = '10px';
        sentinel.style.width = '100%';
        galleryContainer.appendChild(sentinel);
        batchObserver.observe(sentinel);
        
        // Observer for loading iframes when they enter viewport
        const itemObserver = new IntersectionObserver((entries, observerInstance) => {
            entries.forEach(entry => {
                // Process regardless of scrolling state now
                if (entry.isIntersecting) {
                    const galleryItem = entry.target;
                    const artPath = galleryItem.dataset.artPath;
                    const placeholder = galleryItem.querySelector('.placeholder');
                    
                    if (placeholder && artPath) {
                        // Replace placeholder with iframe
                        const iframe = document.createElement('iframe');
                        iframe.src = artPath;
                        iframe.title = `Escapist Capital Variation ${galleryItem.dataset.artIndex}`;
                        iframe.loading = 'lazy';
                        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
                        
                        galleryItem.replaceChild(iframe, placeholder);
                        delete galleryItem.dataset.artPath; // Clean up data attribute
                    }
                    
                    observerInstance.unobserve(galleryItem); // Stop observing once loaded
                }
            });
        }, {
            threshold: 0.01, // Keep at 1% visibility threshold
            rootMargin: '1500px 0px', // Extremely aggressive preloading (1500px ahead)
        });

        // Load initial batches at startup (preload multiple batches for smoother scrolling)
        const preloadInitialBatches = () => {
            // Load first batch immediately
            loadNextBatch();
            
            // After a short delay, load more batches to have content ready to display
            setTimeout(() => {
                loadNextBatch();
                
                // Load a third batch after another delay
                setTimeout(() => {
                    loadNextBatch();
                    
                    // Load a fourth batch for even more preloaded content
                    setTimeout(() => {
                        loadNextBatch();
                    }, 700);
                }, 800);
            }, 1200);
        };

        // Observe all gallery items for lazy loading
        const observeItems = () => {
            document.querySelectorAll('.gallery-item[data-art-path]').forEach(item => {
                itemObserver.observe(item);
            });
        };
        
        // Observe initial items
        observeItems();
        
        // Update sentinel position after each batch load
        const updateSentinel = () => {
            galleryContainer.appendChild(sentinel); // Move sentinel to the end
        };
        
        // Setup mutation observer to detect when new items are added
        const mutationObserver = new MutationObserver((mutations) => {
            let shouldObserve = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.classList && node.classList.contains('gallery-item')) {
                            shouldObserve = true;
                        }
                    });
                }
            });
            
            if (shouldObserve) {
                observeItems();
                updateSentinel();
            }
        });
        
        mutationObserver.observe(galleryContainer, { childList: true });
        
        // Handle scroll events - now we only use this to detect when scrolling stops
        // but still load items during scrolling
        let loadScrollTimeout;
        window.addEventListener('scroll', () => {
            isScrolling = true;
            clearTimeout(loadScrollTimeout);
            
            // Process items that are about to enter viewport during scrolling
            document.querySelectorAll('.gallery-item[data-art-path]').forEach(item => {
                // Check if item is in viewport or about to enter it
                const rect = item.getBoundingClientRect();
                const isNearViewport = (
                    rect.top >= -1500 &&
                    rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight + 1500) &&
                    rect.right <= window.innerWidth
                );
                
                if (isNearViewport) {
                    const artPath = item.dataset.artPath;
                    const placeholder = item.querySelector('.placeholder');
                    
                    if (placeholder && artPath) {
                        // Replace placeholder with iframe
                        const iframe = document.createElement('iframe');
                        iframe.src = artPath;
                        iframe.title = `Escapist Capital Variation ${item.dataset.artIndex}`;
                        iframe.loading = 'lazy';
                        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
                        
                        item.replaceChild(iframe, placeholder);
                        delete item.dataset.artPath; // Clean up data attribute
                        itemObserver.unobserve(item); // Stop observing this item
                    }
                }
            });
            
            // Wait until scrolling stops before loading non-visible content
            loadScrollTimeout = setTimeout(() => {
                isScrolling = false;
            }, 200);
        });
    } else {
        // Fallback for older browsers: load all at once
        for (let i = 1; i <= totalPieces; i++) {
            createGalleryItem(i);
        }
        galleryItems.forEach(item => item.style.opacity = 1);
    }

    // --- Font Loading Detection ---
    // Use document.fonts.ready (modern browsers) to remove the loading class
    if ('fonts' in document) {
        document.fonts.ready.then(() => {
            document.body.classList.remove('fonts-loading');
            // Start the initial batch loading after fonts are ready
            // This ensures the splash screen shows properly with the correct fonts
            if (!initialBatchLoaded) {
                // Load initial batches for smoother scrolling experience
                setTimeout(preloadInitialBatches, 500);
            }
        }).catch(error => {
            console.error('Font loading error:', error);
            // Remove class anyway in case of error, fallback font will be used
            document.body.classList.remove('fonts-loading');
            if (!initialBatchLoaded) {
                setTimeout(preloadInitialBatches, 500);
            }
        });
    } else {
        // Fallback for older browsers (might still flash)
        // Remove class after a short delay as a basic fallback
        setTimeout(() => {
            document.body.classList.remove('fonts-loading');
            if (!initialBatchLoaded) {
                setTimeout(preloadInitialBatches, 500);
            }
        }, 500); // Adjust delay if needed
    }
    
    // We already applied the theme above, no need to redeclare savedTheme or check again
    
    // Fallback to ensure splash screen doesn't stay indefinitely
    setTimeout(() => {
        if (!initialBatchLoaded && !splashScreenRemoved) {
            loadNextBatch(); // Force load first batch
            setTimeout(() => {
                splashScreen.classList.add('hidden');
                splashScreenRemoved = true; // Mark as removed to prevent reappearing
            }, 2000);
        }
    }, 8000); // Increased from 5000ms to 8000ms to wait longer before force closing
});
