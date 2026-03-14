document.addEventListener('DOMContentLoaded', () => {
    const itemBody = document.getElementById('itemBody');
    const addRowBtn = document.getElementById('addRowBtn');
    const clearBtn = document.getElementById('clearBtn');
    const printBtn = document.getElementById('printBtn');
    const discountRateInput = document.getElementById('discountRate');

    const subtotalEl = document.getElementById('subtotal');
    const discountAmountEl = document.getElementById('discountAmount');
    const vatAmountEl = document.getElementById('vatAmount');
    const finalTotalEl = document.getElementById('finalTotal');
    const totalAmountTextEl = document.getElementById('totalAmountText');
    const discountLabelEl = document.getElementById('discountLabel');
    const currentDateEl = document.getElementById('currentDate');

    // Set Today's Date
    currentDateEl.innerText = new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Initial 1 Row (v4.5 Default Data)
    addRow("헬스매트", "20t", "1", "8163");

    // Account Tabs Logic
    const accountTabs = document.querySelectorAll('.account-tab');
    const accountInfo = document.getElementById('accountInfo');
    const accounts = {
        issue: '농협 301-0309-3057-11 인스포트 주식회사',
        'no-issue': '카카오뱅크 3333-14-2092777 이진영'
    };

    accountTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            accountTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            accountInfo.innerText = accounts[tab.dataset.type];
        });
    });

    // Discount Label Sync on Start
    discountRateInput.value = 10;
    discountLabelEl.innerText = discountRateInput.value;
    updateTotals();

    // Add Row Event
    addRowBtn.addEventListener('click', () => addRow());

    // 자주 사용하는 품목 퀵 추가 (v4.7)
    const addMat20Btn = document.getElementById('addMat20');
    const addMat25Btn = document.getElementById('addMat25');

    if (addMat20Btn) {
        addMat20Btn.addEventListener('click', () => addRow("헬스매트", "20t", "1", "8163"));
    }
    if (addMat25Btn) {
        addMat25Btn.addEventListener('click', () => addRow("헬스매트", "25t", "1", "9967"));
    }

    // Clear All
    clearBtn.addEventListener('click', () => {
        if (confirm('대장님, 모든 내용을 초기화하시겠습니까?')) {
            itemBody.innerHTML = '';
            addRow("헬스매트", "20t", "1", "8163");
            discountRateInput.value = 10;

            // 계좌 정보 초기화 (미발행 디폴트)
            accountTabs.forEach(t => t.classList.remove('active'));
            const noIssueTab = Array.from(accountTabs).find(t => t.dataset.type === 'no-issue');
            if (noIssueTab) {
                noIssueTab.classList.add('active');
                accountInfo.innerText = accounts['no-issue'];
            }

            updateTotals();
        }
    });

    const pdfBtn = document.getElementById('pdfBtn');
    const screenshotBtn = document.getElementById('screenshotBtn');
    const copyBtn = document.getElementById('copyBtn');
    const quotationArea = document.getElementById('quotationArea');

    // ... (rest of initializations)

    // Integration of Capture functions for PDF, Image, and Copy
    async function getQuotationCanvas() {
        // 1. Hide no-print elements and set offset safety
        const noPrintElements = document.querySelectorAll('.no-print');
        noPrintElements.forEach(el => el.style.display = 'none');

        // 2. Hide placeholders during capture
        quotationArea.classList.add('capturing-mode');

        // 3. Temporarily set container styles to ensure zero-offset
        const originalScrollX = window.scrollX;
        const originalScrollY = window.scrollY;
        window.scrollTo(0, 0);

        try {
            const canvas = await html2canvas(quotationArea, {
                scale: 3, // Quality improvement
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                windowWidth: 1000, // Fixed width for consistent layout
                scrollX: 0,
                scrollY: 0,
                x: 0,
                y: 0
            });
            return canvas;
        } finally {
            // Restore visibility, class and position
            noPrintElements.forEach(el => el.style.display = '');
            quotationArea.classList.remove('capturing-mode');
            window.scrollTo(originalScrollX, originalScrollY);
        }
    }

    // Clipboard Copy (Image)
    copyBtn.addEventListener('click', async () => {
        try {
            copyBtn.innerText = '⏳ 처리 중...';
            const canvas = await getQuotationCanvas();

            canvas.toBlob(async (blob) => {
                try {
                    const item = new ClipboardItem({ "image/png": blob });
                    await navigator.clipboard.write([item]);

                    const originalText = '📋 클립보드 복사(이미지)';
                    copyBtn.innerText = '✅ 복사 완료!';
                    copyBtn.classList.add('btn-success');

                    setTimeout(() => {
                        copyBtn.innerText = originalText;
                        copyBtn.classList.remove('btn-success');
                    }, 2000);
                } catch (err) {
                    console.error('Clipboard write failed:', err);
                    alert('클립보드 복사 권한이 없거나 지원되지 않는 브라우저입니다.');
                    copyBtn.innerText = '📋 클립보드 복사(이미지)';
                }
            }, 'image/png');

        } catch (error) {
            console.error('Copy failed:', error);
            alert('복사 중 오류가 발생했습니다.');
            copyBtn.innerText = '📋 클립보드 복사(이미지)';
        }
    });

    // PDF Save
    pdfBtn.addEventListener('click', async () => {
        const { jsPDF } = window.jspdf;
        try {
            pdfBtn.innerText = '⏳ 처리 중...';
            const canvas = await getQuotationCanvas();

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`견적서_${new Date().getTime()}.pdf`);
            pdfBtn.innerText = '📄 PDF 저장';
        } catch (error) {
            console.error('PDF export failed:', error);
            alert('PDF 저장 중 오류가 발생했습니다.');
            pdfBtn.innerText = '📄 PDF 저장';
        }
    });

    // Screenshot Save
    screenshotBtn.addEventListener('click', async () => {
        try {
            screenshotBtn.innerText = '⏳ 캡처 중...';
            const canvas = await getQuotationCanvas();

            const link = document.createElement('a');
            link.download = `견적서_캡처_${new Date().getTime()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            screenshotBtn.innerText = '🖼️ 이미지 저장';
        } catch (error) {
            console.error('Screenshot failed:', error);
            alert('이미지 저장 중 오류가 발생했습니다.');
            screenshotBtn.innerText = '🖼️ 이미지 저장';
        }
    });

    // Print
    printBtn.addEventListener('click', () => {
        window.print();
    });

    // Discount Rate Change
    discountRateInput.addEventListener('input', () => {
        discountLabelEl.innerText = discountRateInput.value || 0;
        updateTotals();
    });

    // --- Storage Logic (v3.0) ---
    const saveDataBtn = document.getElementById('saveDataBtn');
    const savedListEl = document.getElementById('savedList');
    const favoriteListEl = document.getElementById('favoriteList');

    function getStorageData() {
        return JSON.parse(localStorage.getItem('inspo_quotations') || '[]');
    }

    function setStorageData(data) {
        localStorage.setItem('inspo_quotations', JSON.stringify(data));
        renderList();
    }

    function renderList() {
        const data = getStorageData();
        savedListEl.innerHTML = '';
        favoriteListEl.innerHTML = '';

        if (data.length === 0) {
            savedListEl.innerHTML = '<p class="empty-msg">저장된 견적이 없습니다.</p>';
            favoriteListEl.innerHTML = '<p class="empty-msg">즐겨찾기가 없습니다.</p>';
            return;
        }

        data.sort((a, b) => b.id - a.id); // Latest first

        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'saved-item';
            div.innerHTML = `
                <div class="title">${item.customer || '수신인 미정'}</div>
                <div class="date">${new Date(item.id).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                <div class="actions">
                    <button class="btn-action btn-fav ${item.isFav ? 'active' : ''}" onclick="event.stopPropagation(); window.antigravity_toggleFav(${item.id})">★</button>
                    <button class="btn-action btn-del" onclick="event.stopPropagation(); window.antigravity_deleteItem(${item.id})">🗑️</button>
                </div>
            `;
            div.onclick = () => loadQuotation(item);

            if (item.isFav) {
                const favDiv = div.cloneNode(true);
                favDiv.onclick = () => loadQuotation(item);
                favoriteListEl.appendChild(favDiv);
            }
            savedListEl.appendChild(div);
        });
    }

    window.antigravity_toggleFav = (id) => {
        const data = getStorageData();
        const item = data.find(i => i.id === id);
        if (item) {
            item.isFav = !item.isFav;
            setStorageData(data);
        }
    };

    window.antigravity_deleteItem = (id) => {
        if (confirm('이 견적 기록을 삭제할까요?')) {
            const data = getStorageData();
            const filtered = data.filter(i => i.id !== id);
            setStorageData(filtered);
        }
    };

    saveDataBtn.addEventListener('click', () => {
        const customer = document.getElementById('customerName').innerText.trim();
        const rows = itemBody.querySelectorAll('tr');
        const items = [];

        rows.forEach(row => {
            const name = row.querySelector('.item-name').innerText;
            const option = row.querySelector('.item-option').innerText;
            const qty = row.querySelector('.item-qty').innerText;
            const price = row.querySelector('.item-price').innerText;
            if (name || qty || price) {
                items.push({ name, option, qty, price });
            }
        });

        if (items.length === 0) {
            alert('대장님, 저장할 품목이 하나도 없습니다!');
            return;
        }

        const activeAccountType = document.querySelector('.account-tab.active').dataset.type;
        const discountRate = discountRateInput.value;

        const newData = {
            id: Date.now(),
            customer,
            items,
            accountType: activeAccountType,
            discountRate: discountRate,
            isFav: false
        };

        const currentData = getStorageData();
        currentData.push(newData);
        setStorageData(currentData);
        alert('성공적으로 저장되었습니다! 사이드바 목록에서 확인하세요.');
    });

    function loadQuotation(data) {
        if (!confirm(`'${data.customer || '수신인 미정'}' 견적 데이터를 불러올까요?\n현재 작성 중인 내용은 사라집니다.`)) return;

        // Reset
        itemBody.innerHTML = '';
        document.getElementById('customerName').innerText = data.customer;
        discountRateInput.value = data.discountRate;
        discountLabelEl.innerText = data.discountRate;

        // Restore Rows
        data.items.forEach(item => {
            addRowData(item);
        });

        // Restore Account Tab (Tax issue or not)
        const accountTabs = document.querySelectorAll('.account-tab');
        accountTabs.forEach(tab => {
            if (tab.dataset.type === data.accountType) {
                tab.click();
            }
        });

        updateTotals();
    }

    function addRowData(item) {
        addRow(); // Adds an empty row
        const lastRow = itemBody.lastElementChild;
        lastRow.querySelector('.item-name').innerText = item.name;
        lastRow.querySelector('.item-option').innerText = item.option;
        lastRow.querySelector('.item-qty').innerText = item.qty;
        lastRow.querySelector('.item-price').innerText = item.price;
    }

    renderList(); // Initial render

    // --- Mobile Interactivity (v4.0) ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const sidebar = document.getElementById('sidebar');

    function toggleMobileMenu() {
        sidebar.classList.toggle('active');
        mobileOverlay.classList.toggle('active');
    }

    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    mobileOverlay.addEventListener('click', toggleMobileMenu);

    function addRow(name = "", option = "", qty = "", price = "") {
        const tr = document.createElement('tr');
        const rowCount = itemBody.children.length + 1;

        // 천단위 콤마 포맷팅 (가격/수량이 있다면)
        const displayPrice = price ? Number(price).toLocaleString('ko-KR') : "";
        const displayQty = qty ? Number(qty).toLocaleString('ko-KR') : "";

        tr.innerHTML = `
            <td>${rowCount}</td>
            <td><div class="editable-cell item-name" contenteditable="true" data-placeholder="상품명">${name}</div></td>
            <td><div class="editable-cell item-option" contenteditable="true" data-placeholder="규격">${option}</div></td>
            <td><div class="editable-cell item-qty" contenteditable="true" data-placeholder="입력">${displayQty}</div></td>
            <td><div class="editable-cell item-price" contenteditable="true" data-placeholder="입력">${displayPrice}</div></td>
            <td class="text-right item-row-total"></td>
            <td class="no-print"><button class="btn-danger remove-row">×</button></td>
        `;

        // Add event listeners to editable cells
        const editables = tr.querySelectorAll('.editable-cell');
        editables.forEach(cell => {
            cell.addEventListener('input', (e) => {
                if (cell.classList.contains('item-qty') || cell.classList.contains('item-price')) {
                    const val = cell.innerText.trim();
                    if (!val.startsWith('=')) {
                        const numericValue = stripCommas(val);
                        if (!isNaN(numericValue) && val !== '') {
                            const formatted = Number(numericValue).toLocaleString('ko-KR');
                            if (cell.innerText !== formatted) {
                                // Save cursor position accurately
                                const selection = window.getSelection();
                                if (selection.rangeCount > 0) {
                                    const range = selection.getRangeAt(0);
                                    const cursorOffset = range.startOffset;
                                    const textBeforeCursor = cell.innerText.substring(0, cursorOffset);
                                    const digitsBeforeCursor = textBeforeCursor.replace(/,/g, '').length;

                                    cell.innerText = formatted;

                                    // Restore cursor by counting digits from start
                                    let newOffset = 0;
                                    let digitsCount = 0;
                                    const textNodes = cell.childNodes;
                                    if (textNodes.length > 0) {
                                        const newRange = document.createRange();
                                        while (newOffset < formatted.length && digitsCount < digitsBeforeCursor) {
                                            if (formatted[newOffset] !== ',') digitsCount++;
                                            newOffset++;
                                        }
                                        newRange.setStart(textNodes[0], newOffset);
                                        newRange.collapse(true);
                                        selection.removeAllRanges();
                                        selection.addRange(newRange);
                                    }
                                } else {
                                    cell.innerText = formatted;
                                }
                            }
                        }
                    }
                }
                updateTotals();
            });

            // Special handling for Formula on blur
            if (cell.classList.contains('item-price')) {
                cell.addEventListener('blur', () => {
                    const val = cell.innerText.trim();
                    if (val.startsWith('=')) {
                        const result = evaluateFormula(val.substring(1));
                        cell.innerText = result > 0 ? result.toLocaleString('ko-KR') : '';
                        updateTotals();
                    }
                });
            }
        });

        // Remove row
        tr.querySelector('.remove-row').addEventListener('click', () => {
            tr.remove();
            reorderNumbers();
            updateTotals();
        });

        itemBody.appendChild(tr);
        reorderNumbers();
    }

    function stripCommas(str) {
        return str.toString().replace(/,/g, '');
    }

    function evaluateFormula(formula) {
        try {
            const cleanedFormula = stripCommas(formula);
            const sanitized = cleanedFormula.replace(/[^0-9+\-*/().]/g, '');
            const result = new Function(`return ${sanitized}`)();
            return isFinite(result) ? Math.floor(result) : 0;
        } catch (e) {
            console.error('Formula error:', e);
            return 0;
        }
    }

    function reorderNumbers() {
        const rows = itemBody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            row.cells[0].innerText = index + 1;
        });
    }

    function formatKRW(number) {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW',
            currencyDisplay: 'symbol'
        }).format(number).replace('₩', '￦');
    }

    function updateTotals() {
        const rows = itemBody.querySelectorAll('tr');
        let totalIncoming = 0; // 총 합계 (입력된 금액의 합)

        rows.forEach(row => {
            const qtyEl = row.querySelector('.item-qty');
            const qty = parseFloat(stripCommas(qtyEl.innerText)) || 0;

            const priceEl = row.querySelector('.item-price');
            const priceVal = priceEl.innerText.trim();

            let price = 0;
            if (priceVal.startsWith('=')) {
                price = evaluateFormula(priceVal.substring(1));
            } else {
                price = parseFloat(stripCommas(priceVal)) || 0;
            }

            const rowTotal = qty * price;

            const rowTotalEl = row.querySelector('.item-row-total');
            rowTotalEl.innerText = rowTotal > 0 ? rowTotal.toLocaleString('ko-KR') : '';
            totalIncoming += rowTotal;
        });

        const discountRate = parseFloat(discountRateInput.value) || 0;
        const discountAmount = Math.floor(totalIncoming * (discountRate / 100));

        // 최종 결제 금액 (총액에서 할인액만 차감)
        const finalTotal = totalIncoming - discountAmount;

        // Update DOM
        subtotalEl.innerText = totalIncoming.toLocaleString('ko-KR');
        discountAmountEl.innerText = `- ${discountAmount.toLocaleString('ko-KR')}`;
        finalTotalEl.innerText = finalTotal.toLocaleString('ko-KR');
        totalAmountTextEl.innerText = `￦ ${finalTotal.toLocaleString('ko-KR')}`;
    }

});

