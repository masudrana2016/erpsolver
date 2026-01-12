// ==UserScript==
// @name         IVAC Automation with Countdown & Anti-AutoClick (Fixed)
// @namespace    http://tampermonkey.net/
// @version      7.0
// @description  Full IVAC UI automation with ascending countdown (1s-57s) and anti-autoclick protection
// @author       Paid User
// @match        https://payment.ivacbd.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    let countdownDuration = 1800, isCounting = false, currentCountdown = null, lastActionTime = 0;
    let isDragging = false, dragOffset = { x: 0, y: 0 };

    const countdownDisplay = document.createElement('div');
    Object.assign(countdownDisplay.style, {
        width: '100%', padding: '4px', marginBottom: '3px', background: 'linear-gradient(135deg, #f44336, #d32f2f)',
        color: '#fff', fontSize: '14px', fontWeight: 'bold', borderRadius: '2px', textAlign: 'center',
        fontFamily: 'monospace', display: 'none', boxSizing: 'border-box'
    });

    const controlPanel = document.createElement('div');
    Object.assign(controlPanel.style, {
        position: 'fixed', bottom: '30px', right: '120px', padding: '4px',
        background: 'linear-gradient(135deg, #2196f3, #1976d2)', color: '#fff', borderRadius: '4px',
        boxShadow: '0 0 8px rgba(0,0,0,0.3)', fontFamily: 'Arial, sans-serif', zIndex: '99999',
        width: '75px', cursor: 'move', userSelect: 'none'
    });

    const btnStyle = (bg) => ({
        width: '100%', padding: '3px', background: bg, color: '#fff', border: 'none',
        borderRadius: '2px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s ease'
    });

    controlPanel.addEventListener('mousedown', (e) => {
        if ((e.target === controlPanel || e.target.tagName === 'LABEL') && e.target !== closeButton) {
            isDragging = true;
            const rect = controlPanel.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            controlPanel.style.cursor = 'grabbing';
            e.preventDefault();
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const maxX = window.innerWidth - controlPanel.offsetWidth;
            const maxY = window.innerHeight - controlPanel.offsetHeight;
            controlPanel.style.left = Math.max(0, Math.min(e.clientX - dragOffset.x, maxX)) + 'px';
            controlPanel.style.top = Math.max(0, Math.min(e.clientY - dragOffset.y, maxY)) + 'px';
            controlPanel.style.bottom = 'auto';
            controlPanel.style.right = 'auto';
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            controlPanel.style.cursor = 'move';
        }
    });

    const durationLabel = document.createElement('label');
    Object.assign(durationLabel.style, {
        display: 'block', marginBottom: '2px', fontSize: '8px', fontWeight: 'bold'
    });
    durationLabel.textContent = 'Duration (s):';

    const durationInput = document.createElement('input');
    Object.assign(durationInput.style, {
        width: '100%', padding: '2px', marginBottom: '3px', border: 'none', borderRadius: '2px',
        fontSize: '10px', textAlign: 'center', boxSizing: 'border-box'
    });
    durationInput.type = 'number';
    durationInput.min = '1';
    durationInput.value = countdownDuration;

    const startButton = document.createElement('button');
    Object.assign(startButton.style, btnStyle('linear-gradient(135deg, #4caf50, #388e3c)'));
    startButton.textContent = '🚀 Start';

    const stopButton = document.createElement('button');
    Object.assign(stopButton.style, { ...btnStyle('linear-gradient(135deg, #f44336, #d32f2f)'), marginTop: '2px', display: 'none' });
    stopButton.textContent = '⏹️ Stop';

    const closeButton = document.createElement('button');
    Object.assign(closeButton.style, {
        position: 'absolute', top: '1px', right: '1px', width: '16px', height: '16px', padding: '0',
        background: 'rgba(255, 255, 255, 0.2)', color: '#fff', border: 'none', borderRadius: '2px',
        fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1'
    });
    closeButton.textContent = '×';
    closeButton.title = 'Close panel';

    const hover = (el, enter, leave) => {
        el.addEventListener('mouseenter', () => enter());
        el.addEventListener('mouseleave', () => leave());
    };

    hover(closeButton,
        () => { closeButton.style.background = 'rgba(255, 255, 255, 0.3)'; closeButton.style.transform = 'scale(1.1)'; },
        () => { closeButton.style.background = 'rgba(255, 255, 255, 0.2)'; closeButton.style.transform = 'scale(1)'; }
    );

    closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        controlPanel.style.display = 'none';
    });

    hover(startButton,
        () => { if (!startButton.disabled) { startButton.style.transform = 'scale(1.05)'; startButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'; } },
        () => { startButton.style.transform = 'scale(1)'; startButton.style.boxShadow = 'none'; }
    );

    hover(stopButton,
        () => { stopButton.style.transform = 'scale(1.05)'; stopButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'; },
        () => { stopButton.style.transform = 'scale(1)'; stopButton.style.boxShadow = 'none'; }
    );

    [closeButton, durationLabel, durationInput, countdownDisplay, startButton, stopButton].forEach(el => controlPanel.appendChild(el));
    document.body.appendChild(controlPanel);

    const resetBtn = () => {
        startButton.textContent = '🚀 Start';
        startButton.style.background = 'linear-gradient(135deg, #4caf50, #388e3c)';
        stopButton.style.display = 'none';
    };

    function startNewCountdown(customDuration = null) {
        if (currentCountdown) {
            clearInterval(currentCountdown);
            currentCountdown = null;
        }
        const duration = customDuration || countdownDuration;
        let currentSecond = 1;
        isCounting = true;
        countdownDisplay.innerText = `⏳ ${currentSecond}s`;
        countdownDisplay.style.display = 'block';
        startButton.style.background = 'linear-gradient(135deg, #4caf50, #388e3c)';
        stopButton.style.display = 'block';

        currentCountdown = setInterval(() => {
            currentSecond++;
            countdownDisplay.innerText = `⏳ ${currentSecond}s`;
            if (currentSecond >= duration) {
                clearInterval(currentCountdown);
                currentCountdown = null;
                countdownDisplay.style.display = 'none';
                isCounting = false;
                resetBtn();
            }
        }, 1000);
    }

    startButton.addEventListener('click', () => {
        const inputDuration = parseInt(durationInput.value);
        if (inputDuration && inputDuration >= 1) {
            countdownDuration = inputDuration;
            startNewCountdown(inputDuration);
        } else {
            alert('Please enter a valid duration of at least 1 second.');
        }
    });

    stopButton.addEventListener('click', () => {
        if (currentCountdown) {
            clearInterval(currentCountdown);
            currentCountdown = null;
            countdownDisplay.style.display = 'none';
            isCounting = false;
            resetBtn();
        }
    });

    const allowRealClickOnly = (element) => {
        element.addEventListener('click', (event) => {
            if (!event.isTrusted || Date.now() - lastActionTime < 100) return false;
            lastActionTime = Date.now();
            startNewCountdown(parseInt(durationInput.value) || countdownDuration);
        }, true);
    };

    const protectAllButtons = () => {
        document.querySelectorAll('button, input[type="submit"], input[type="button"]').forEach(button => {
            if (!controlPanel.contains(button)) allowRealClickOnly(button);
        });
    };

    new MutationObserver(protectAllButtons).observe(document.body, { childList: true, subtree: true });
    protectAllButtons();

    if (currentCountdown) {
        clearInterval(currentCountdown);
        currentCountdown = null;
    }
    isCounting = false;
    countdownDisplay.style.display = 'none';
    resetBtn();

})();
