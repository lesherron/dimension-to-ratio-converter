document.addEventListener('DOMContentLoaded', function() {
    // Input elements
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const unitSelect = document.getElementById('unit');
    const ppiInput = document.getElementById('ppi');
    const imageUpload = document.getElementById('image-upload');
    
    // Button elements
    const calculateBtn = document.getElementById('calculate-btn');
    const swapBtn = document.getElementById('swap-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyRatioBtn = document.getElementById('copy-ratio');
    const addToHistoryBtn = document.getElementById('add-to-history');
    const toggleToolsBtn = document.getElementById('toggle-tools');
    const clearHistoryBtn = document.getElementById('clear-history');
    
    // Display elements
    const resultBox = document.getElementById('result-box');
    const ratioResult = document.getElementById('ratio-result');
    const decimalRatio = document.getElementById('decimal-ratio');
    const commonRatioMatch = document.getElementById('common-ratio-match');
    const ratioVisualization = document.getElementById('ratio-visualization');
    const widthError = document.getElementById('width-error');
    const heightError = document.getElementById('height-error');
    const additionalTools = document.getElementById('additional-tools');
    const conversionResult = document.getElementById('conversion-result');
    const toastMessage = document.getElementById('toast-message');
    const historyCard = document.getElementById('history-card');
    const historyList = document.getElementById('history-list');
    const resolutionInfo = document.getElementById('resolution-info');
    const megapixelsDisplay = document.getElementById('megapixels');
    const fileSizeDisplay = document.getElementById('file-size');
    
    // Preset buttons
    const presetButtons = document.querySelectorAll('.preset-btn');

    // Common aspect ratios with their names
    const commonRatios = [
        { ratio: [1, 1], name: "Square (1:1)" },
        { ratio: [3, 2], name: "Classic 35mm Film (3:2)" },
        { ratio: [4, 3], name: "Standard TV/Computer Monitor (4:3)" },
        { ratio: [16, 9], name: "Widescreen TV/HD Video (16:9)" },
        { ratio: [21, 9], name: "Ultrawide/Cinematic (21:9)" },
        { ratio: [5, 4], name: "Large Format Photography (5:4)" },
        { ratio: [3, 4], name: "Portrait Photo (3:4)" },
        { ratio: [9, 16], name: "Vertical Video/Mobile (9:16)" },
        { ratio: [2, 3], name: "Portrait 35mm Film (2:3)" },
        { ratio: [8, 5], name: "8:5 / 16:10 (Golden Ratio)" },
        { ratio: [6, 4], name: "6:4 / 3:2 (Print Photos)" },
        { ratio: [4, 5], name: "Instagram Portrait (4:5)" },
        { ratio: [1.85, 1], name: "Cinema Standard (1.85:1)" },
        { ratio: [2.35, 1], name: "Anamorphic Widescreen (2.35:1)" }
    ];

    // Initialize history array from localStorage
    let history = JSON.parse(localStorage.getItem('conversionHistory')) || [];
    updateHistoryDisplay();

    // Calculate greatest common divisor using Euclidean algorithm
    function gcd(a, b) {
        return b === 0 ? a : gcd(b, a % b);
    }

    // Find the simplest form of the ratio
    function simplifyRatio(width, height) {
        const divisor = gcd(width, height);
        return [width / divisor, height / divisor];
    }

    // Check if the simplified ratio matches a common ratio
    function findMatchingCommonRatio(simplified) {
        // Check for exact matches
        for (const common of commonRatios) {
            if (common.ratio[0] === simplified[0] && common.ratio[1] === simplified[1]) {
                return common.name;
            }
            
            // Also check the flipped ratio for portrait orientations
            if (common.ratio[0] === simplified[1] && common.ratio[1] === simplified[0]) {
                return common.name + " (Portrait)";
            }
        }
        
        // Check for decimal ratio matches with higher tolerance
        const calculatedRatio = simplified[0] / simplified[1];
        for (const common of commonRatios) {
            const commonRatio = common.ratio[0] / common.ratio[1];
            // Allow a small tolerance for decimal approximations
            if (Math.abs(calculatedRatio - commonRatio) < 0.01) {
                return common.name + " (Approximate)";
            }
            
            // Check flipped ratio
            const flippedCommonRatio = common.ratio[1] / common.ratio[0];
            if (Math.abs(calculatedRatio - flippedCommonRatio) < 0.01) {
                return common.name + " (Portrait, Approximate)";
            }
        }
        
        return null;
    }

    // Validate inputs
    function validateInputs() {
        let isValid = true;
        
        if (!widthInput.value || widthInput.value <= 0) {
            widthError.style.display = 'block';
            isValid = false;
        } else {
            widthError.style.display = 'none';
        }
        
        if (!heightInput.value || heightInput.value <= 0) {
            heightError.style.display = 'block';
            isValid = false;
        } else {
            heightError.style.display = 'none';
        }
        
        return isValid;
    }

    // Calculate and display the ratio
    function calculateRatio() {
        if (!validateInputs()) {
            return;
        }
        
        const width = parseInt(widthInput.value);
        const height = parseInt(heightInput.value);
        const unit = unitSelect.value;
        
        // The unit doesn't affect the ratio calculation
        const simplified = simplifyRatio(width, height);
        
        // Display the result
        ratioResult.textContent = `${simplified[0]}:${simplified[1]}`;
        
        // Calculate decimal ratio
        const decimalValue = (width / height).toFixed(2);
        decimalRatio.textContent = `(${decimalValue}:1)`;
        
        // Check for matching common ratio
        const matchingRatio = findMatchingCommonRatio(simplified);
        if (matchingRatio) {
            commonRatioMatch.textContent = `Your ratio matches ${matchingRatio}`;
        } else {
            commonRatioMatch.textContent = `This is a custom aspect ratio.`;
        }
        
        // Update visual representation
        updateVisualization(simplified);

        // Update resolution information
        updateResolutionInfo(width, height, unit);
        
        // Show result box
        resultBox.style.display = 'block';

        // Update unit conversion if applicable
        if (unit === 'pixels' || unit === 'inches') {
            updateUnitConversion(width, height, unit);
        }
    }

    // Update resolution information
    function updateResolutionInfo(width, height, unit) {
        if (unit === 'pixels') {
            // Calculate megapixels
            const megapixels = (width * height / 1000000).toFixed(2);
            megapixelsDisplay.textContent = `Megapixels: ${megapixels} MP`;
            
            // Estimate file size (assuming 24-bit color depth = 3 bytes per pixel)
            const bytesPerPixel = 3; // RGB (8 bits per channel)
            const totalBytes = width * height * bytesPerPixel;
            const fileSizeMB = (totalBytes / (1024 * 1024)).toFixed(2);
            
            fileSizeDisplay.textContent = `Estimated file size (uncompressed): ~${fileSizeMB} MB`;
            resolutionInfo.style.display = 'block';
        } else {
            // Hide resolution info for inch measurements
            resolutionInfo.style.display = 'none';
        }
    }

    // Update unit conversion information
    function updateUnitConversion(width, height, unit) {
        const ppi = parseInt(ppiInput.value) || 72;
        
        if (unit === 'pixels') {
            // Convert pixels to inches
            const widthInches = (width / ppi).toFixed(2);
            const heightInches = (height / ppi).toFixed(2);
            conversionResult.textContent = `Dimensions in inches: ${widthInches}" × ${heightInches}"`;
        } else if (unit === 'inches') {
            // Convert inches to pixels
            const widthPixels = Math.round(width * ppi);
            const heightPixels = Math.round(height * ppi);
            conversionResult.textContent = `Dimensions in pixels: ${widthPixels}px × ${heightPixels}px`;
        }
    }

    // Update visual representation of the ratio
    function updateVisualization(ratio) {
        const maxWidth = 300;
        const maxHeight = 200;
        
        let boxWidth, boxHeight;
        
        const aspectRatio = ratio[0] / ratio[1];
        
        if (aspectRatio > 1) {
            // Landscape orientation
            boxWidth = Math.min(maxWidth, maxWidth);
            boxHeight = boxWidth / aspectRatio;
            
            if (boxHeight > maxHeight) {
                boxHeight = maxHeight;
                boxWidth = boxHeight * aspectRatio;
            }
        } else {
            // Portrait orientation
            boxHeight = Math.min(maxHeight, maxHeight);
            boxWidth = boxHeight * aspectRatio;
            
            if (boxWidth > maxWidth) {
                boxWidth = maxWidth;
                boxHeight = boxWidth / aspectRatio;
            }
        }
        
        ratioVisualization.style.width = `${boxWidth}px`;
        ratioVisualization.style.height = `${boxHeight}px`;
    }

    // Swap width and height values
    function swapDimensions() {
        const tempWidth = widthInput.value;
        widthInput.value = heightInput.value;
        heightInput.value = tempWidth;
        
        // Recalculate if results are already showing
        if (resultBox.style.display !== 'none') {
            calculateRatio();
        }
    }

    // Clear all input fields
    function clearFields() {
        widthInput.value = '';
        heightInput.value = '';
        resultBox.style.display = 'none';
        widthError.style.display = 'none';
        heightError.style.display = 'none';
    }

    // Copy ratio to clipboard
    function copyRatioToClipboard() {
        const textToCopy = ratioResult.textContent;
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                // Show toast message
                toastMessage.style.opacity = '1';
                setTimeout(() => {
                    toastMessage.style.opacity = '0';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
    }

    // Toggle additional tools visibility
    function toggleTools() {
        if (additionalTools.style.display === 'none') {
            additionalTools.style.display = 'block';
            toggleToolsBtn.textContent = 'Hide Additional Tools';
        } else {
            additionalTools.style.display = 'none';
            toggleToolsBtn.textContent = 'Show Additional Tools';
        }
    }

    // Add current conversion to history
    function addToHistory() {
        const width = parseInt(widthInput.value);
        const height = parseInt(heightInput.value);
        const unit = unitSelect.value;
        const simplified = simplifyRatio(width, height);
        const ratioText = `${simplified[0]}:${simplified[1]}`;
        
        const historyItem = {
            id: Date.now(), // unique ID based on timestamp
            width: width,
            height: height,
            unit: unit,
            ratio: ratioText,
            timestamp: new Date().toLocaleString()
        };
        
        history.unshift(historyItem); // Add to beginning of array
        
        // Limit history to 20 items
        if (history.length > 20) {
            history.pop();
        }
        
        // Save to localStorage
        localStorage.setItem('conversionHistory', JSON.stringify(history));
        
        // Update display
        updateHistoryDisplay();
    }

    // Update history display
    function updateHistoryDisplay() {
        if (history.length > 0) {
            historyCard.style.display = 'block';
            historyList.innerHTML = '';
            
            history.forEach(item => {
                const historyItemEl = document.createElement('div');
                historyItemEl.className = 'history-item';
                
                const historyData = document.createElement('div');
                historyData.className = 'history-data';
                historyData.innerHTML = `
                    <strong>${item.ratio}</strong> (${item.width}×${item.height} ${item.unit})
                    <div style="font-size: 12px; color: #666;">${item.timestamp}</div>
                `;
                
                const historyActions = document.createElement('div');
                historyActions.className = 'history-actions';
                
                const loadBtn = document.createElement('button');
                loadBtn.className = 'btn btn-small';
                loadBtn.textContent = 'Load';
                loadBtn.addEventListener('click', () => loadHistoryItem(item));
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-small btn-secondary';
                deleteBtn.textContent = 'Delete';
                deleteBtn.addEventListener('click', () => deleteHistoryItem(item.id));
                
                historyActions.appendChild(loadBtn);
                historyActions.appendChild(deleteBtn);
                
                historyItemEl.appendChild(historyData);
                historyItemEl.appendChild(historyActions);
                
                historyList.appendChild(historyItemEl);
            });
        } else {
            historyCard.style.display = 'none';
        }
    }

    // Load a history item into the calculator
    function loadHistoryItem(item) {
        widthInput.value = item.width;
        heightInput.value = item.height;
        unitSelect.value = item.unit;
        calculateRatio();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Delete a history item
    function deleteHistoryItem(id) {
        history = history.filter(item => item.id !== id);
        localStorage.setItem('conversionHistory', JSON.stringify(history));
        updateHistoryDisplay();
    }

    // Clear all history
    function clearAllHistory() {
        history = [];
        localStorage.removeItem('conversionHistory');
        updateHistoryDisplay();
    }

    // Handle image upload to extract dimensions
    function handleImageUpload(e) {
        const file = e.target.files[0];
        
        if (file && file.type.startsWith('image/')) {
            const img = new Image();
            img.onload = function() {
                widthInput.value = img.width;
                heightInput.value = img.height;
                unitSelect.value = 'pixels'; // Set unit to pixels for image dimensions
                calculateRatio();
                
                // Reset the file input
                imageUpload.value = '';
            };
            
            img.src = URL.createObjectURL(file);
        }
    }

    // Batch conversion functionality
    const batchInput = document.getElementById('batch-input');
    const batchConvertBtn = document.getElementById('batch-convert-btn');
    const batchResults = document.getElementById('batch-results');
    const batchResultsBody = document.getElementById('batch-results-body');
    
    // Process batch conversion
    function processBatchConversion() {
        const lines = batchInput.value.trim().split('\n');
        
        if (lines.length === 0 || (lines.length === 1 && lines[0] === '')) {
            alert('Please enter at least one set of dimensions.');
            return;
        }
        
        batchResultsBody.innerHTML = '';
        let hasValidInput = false;
        
        lines.forEach(line => {
            // Match various formats: 1920x1080, 1920 x 1080, 1920X1080, etc.
            const match = line.match(/(\d+)\s*[x×X]\s*(\d+)/);
            
            if (match) {
                hasValidInput = true;
                const width = parseInt(match[1]);
                const height = parseInt(match[2]);
                
                // Calculate the ratio
                const simplified = simplifyRatio(width, height);
                const decimalValue = (width / height).toFixed(2);
                const matchingRatio = findMatchingCommonRatio(simplified);
                
                // Create table row
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${width} × ${height}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${simplified[0]}:${simplified[1]}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${decimalValue}:1</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${matchingRatio || 'Custom'}</td>
                `;
                
                batchResultsBody.appendChild(row);
            }
        });
        
        if (hasValidInput) {
            batchResults.style.display = 'block';
        } else {
            alert('No valid dimensions found. Please use format "width x height" (e.g., "1920x1080").');
        }
    }

    // Add event listeners
    calculateBtn.addEventListener('click', calculateRatio);
    swapBtn.addEventListener('click', swapDimensions);
    clearBtn.addEventListener('click', clearFields);
    copyRatioBtn.addEventListener('click', copyRatioToClipboard);
    addToHistoryBtn.addEventListener('click', addToHistory);
    toggleToolsBtn.addEventListener('click', toggleTools);
    clearHistoryBtn.addEventListener('click', clearAllHistory);
    imageUpload.addEventListener('change', handleImageUpload);
    batchConvertBtn.addEventListener('click', processBatchConversion);
    
    // PPI input change event
    ppiInput.addEventListener('input', function() {
        if (resultBox.style.display !== 'none') {
            updateUnitConversion(
                parseInt(widthInput.value), 
                parseInt(heightInput.value), 
                unitSelect.value
            );
        }
    });
    
    // Unit select change event
    unitSelect.addEventListener('change', function() {
        if (resultBox.style.display !== 'none') {
            calculateRatio();
        }
    });
    
    // Allow Enter key to trigger calculation
    [widthInput, heightInput].forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                calculateRatio();
            }
        });
    });
    
    // Preset button clicks
    presetButtons.forEach(button => {
        button.addEventListener('click', function() {
            widthInput.value = this.dataset.width;
            heightInput.value = this.dataset.height;
            unitSelect.value = 'pixels'; // Presets are typically in pixels
            calculateRatio();
        });
    });
});