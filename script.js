document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 v5.3 스크립트 로드 완료');

    // --- Core Selectors ---
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const itemBody = document.getElementById('itemBody');
    const addRowBtn = document.getElementById('addRowBtn');
    const clearBtn = document.getElementById('clearBtn');
    const printBtn = document.getElementById('printBtn');
    const discountRateInput = document.getElementById('discountRate');

    const subtotalEl = document.getElementById('subtotal');
    const discountAmountEl = document.getElementById('discountAmount');
    const finalTotalEl = document.getElementById('finalTotal');
    const totalAmountTextEl = document.getElementById('totalAmountText');
    const discountLabelEl = document.getElementById('discountLabel');
    const currentDateEl = document.getElementById('currentDate');

    const pdfBtn = document.getElementById('pdfBtn');
    const screenshotBtn = document.getElementById('screenshotBtn');
    const copyBtn = document.getElementById('copyBtn');
    const quotationArea = document.getElementById('quotationArea');

    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const sidebar = document.getElementById('sidebar');

    const accountTabs = document.querySelectorAll('.account-tab');
    const accountInfo = document.getElementById('accountInfo');
    const accounts = {
        issue: '농협 301-0309-3057-11 인스포트 주식회사',
        'no-issue': '카카오뱅크 3333-14-2092777 이진영'
    };

    // --- Tab Switching Logic (v5.0) ---
    navTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const target = tab.dataset.tab;
            console.log('Tab Switching to:', target);

            navTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const targetContent = document.getElementById(`${target}-view`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // --- Initial Setup ---
    if (currentDateEl) {
        currentDateEl.innerText = new Date().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Account Tab Sync
    accountTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            accountTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            if (accountInfo) accountInfo.innerText = accounts[tab.dataset.type];
        });
    });

    // Initial Row
    addRow("헬스매트", "20t", "1", "8163");

    if (discountRateInput) {
        discountRateInput.value = 10;
        if (discountLabelEl) discountLabelEl.innerText = discountRateInput.value;
    }
    updateTotals();

    // --- Command Buttons ---
    if (addRowBtn) addRowBtn.addEventListener('click', () => addRow());

    const addMat20Btn = document.getElementById('addMat20');
    const addMat25Btn = document.getElementById('addMat25');
    if (addMat20Btn) addMat20Btn.addEventListener('click', () => addRow("헬스매트", "20t", "1", "8163"));
    if (addMat25Btn) addMat25Btn.addEventListener('click', () => addRow("헬스매트", "25t", "1", "9967"));

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('대장님, 모든 내용을 초기화하시겠습니까?')) {
                itemBody.innerHTML = '';
                addRow("헬스매트", "20t", "1", "8163");
                if (discountRateInput) discountRateInput.value = 10;
                updateTotals();
            }
        });
    }

    if (printBtn) printBtn.addEventListener('click', () => window.print());

    // --- Capture & Export (v4.8) ---
    async function getQuotationCanvas() {
        const noPrintElements = document.querySelectorAll('.no-print');
        noPrintElements.forEach(el => el.style.display = 'none');
        quotationArea.classList.add('capturing-mode');
        const originalScrollX = window.scrollX;
        const originalScrollY = window.scrollY;
        window.scrollTo(0, 0);

        try {
            return await html2canvas(quotationArea, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                windowWidth: 1000,
                scrollX: 0,
                scrollY: 0,
                x: 0,
                y: 0
            });
        } finally {
            noPrintElements.forEach(el => el.style.display = '');
            quotationArea.classList.remove('capturing-mode');
            window.scrollTo(originalScrollX, originalScrollY);
        }
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            copyBtn.innerText = '⏳ 처리 중...';
            try {
                const canvas = await getQuotationCanvas();
                canvas.toBlob(async (blob) => {
                    const item = new ClipboardItem({ "image/png": blob });
                    await navigator.clipboard.write([item]);
                    copyBtn.innerText = '✅ 복사 완료!';
                    setTimeout(() => copyBtn.innerText = '📋 클립보드 복사(이미지)', 2000);
                }, 'image/png');
            } catch (err) {
                alert('복사 중 오류가 발생했습니다.');
                copyBtn.innerText = '📋 클립보드 복사(이미지)';
            }
        });
    }

    if (pdfBtn) {
        pdfBtn.addEventListener('click', async () => {
            const { jsPDF } = window.jspdf;
            pdfBtn.innerText = '⏳ 처리 중...';
            try {
                const canvas = await getQuotationCanvas();
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`견적서_${Date.now()}.pdf`);
                pdfBtn.innerText = '📄 PDF 저장';
            } catch (err) {
                alert('PDF 저장 오류');
                pdfBtn.innerText = '📄 PDF 저장';
            }
        });
    }

    if (screenshotBtn) {
        screenshotBtn.addEventListener('click', async () => {
            screenshotBtn.innerText = '⏳ 캡처 중...';
            try {
                const canvas = await getQuotationCanvas();
                const link = document.createElement('a');
                link.download = `견적서_${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                screenshotBtn.innerText = '🖼️ 이미지 저장';
            } catch (err) {
                alert('이미지 저장 오류');
                screenshotBtn.innerText = '🖼️ 이미지 저장';
            }
        });
    }

    // --- Quantity Calculator (v5.0) ---
    const calcWidthInput = document.getElementById('calc-width');
    const calcHeightInput = document.getElementById('calc-height');
    const calcTotalAreaEl = document.getElementById('calc-total-area');
    const prodWidthInput = document.getElementById('prod-width');
    const prodHeightInput = document.getElementById('prod-height');
    const calcNeededQtyEl = document.getElementById('calc-needed-qty');
    const calcExactQtyEl = document.getElementById('calc-exact-qty');
    const addToQuoteBtn = document.getElementById('add-to-quote-btn');
    const presetBtns = document.querySelectorAll('.preset-btn');
    const customSizeInputs = document.getElementById('custom-size-inputs');

    function calculateNeededQty() {
        if (!calcWidthInput || !calcHeightInput || !calcTotalAreaEl) return;
        const w = parseFloat(calcWidthInput.value) || 0;
        const h = parseFloat(calcHeightInput.value) || 0;
        const area = w * h;
        calcTotalAreaEl.innerText = area.toFixed(2);
        const pw = parseFloat(prodWidthInput.value) || 30;
        const ph = parseFloat(prodHeightInput.value) || 30;
        const pArea = (pw / 100) * (ph / 100);
        if (pArea > 0 && area > 0) {
            const exact = area / pArea;
            const needed = Math.ceil(exact);
            calcExactQtyEl.innerText = exact.toFixed(2);
            calcNeededQtyEl.innerText = needed.toLocaleString('ko-KR');
        } else {
            calcExactQtyEl.innerText = "0.00";
            calcNeededQtyEl.innerText = "0";
        }
    }

    [calcWidthInput, calcHeightInput, prodWidthInput, prodHeightInput].forEach(inp => {
        if (inp) inp.addEventListener('input', calculateNeededQty);
    });

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (btn.dataset.type === 'custom') {
                if (customSizeInputs) customSizeInputs.style.display = 'flex';
            } else {
                if (customSizeInputs) customSizeInputs.style.display = 'none';
                if (btn.dataset.w) prodWidthInput.value = btn.dataset.w;
                if (btn.dataset.h) prodHeightInput.value = btn.dataset.h;
                calculateNeededQty();
            }
        });
    });

    if (addToQuoteBtn) {
        addToQuoteBtn.addEventListener('click', () => {
            const qty = calcNeededQtyEl.innerText.replace(/,/g, '');
            if (qty === "0") {
                alert('대장님, 수량이 0입니다!');
                return;
            }
            const quoteTab = Array.from(navTabs).find(t => t.dataset.tab === 'quotation');
            if (quoteTab) quoteTab.click();
            
            const activeBtn = document.querySelector('.preset-btn.active');
            const prodSize = `${prodWidthInput.value}cm × ${prodHeightInput.value}cm`;
            let prodLabel = activeBtn ? activeBtn.innerText.split('\n')[0].trim() : "제품";
            if (prodLabel.includes('직접 입력')) prodLabel = "제품";

            addRow(`${prodLabel} (수량 계산 반영)`, `규격: ${prodSize}`, qty, "0");
            alert('견적서에 추가되었습니다!');
        });
    }

    // --- Core Functions (addRow, updateTotals, etc.) ---
    function addRow(name = "", option = "", qty = "", price = "") {
        if (!itemBody) return;
        const tr = document.createElement('tr');
        const rowCount = itemBody.children.length + 1;
        const displayPrice = price ? Number(stripCommas(price)).toLocaleString('ko-KR') : "";
        const displayQty = qty ? Number(stripCommas(qty)).toLocaleString('ko-KR') : "";

        tr.innerHTML = `
            <td>${rowCount}</td>
            <td><div class="editable-cell item-name" contenteditable="true">${name}</div></td>
            <td><div class="editable-cell item-option" contenteditable="true">${option}</div></td>
            <td><div class="editable-cell item-qty" contenteditable="true">${displayQty}</div></td>
            <td><div class="editable-cell item-price" contenteditable="true">${displayPrice}</div></td>
            <td class="text-right item-row-total"></td>
            <td class="no-print"><button class="btn-danger remove-row">×</button></td>
        `;

        tr.querySelectorAll('.editable-cell').forEach(cell => {
            cell.addEventListener('input', () => {
                updateTotals();
            });
        });

        tr.querySelector('.remove-row').addEventListener('click', () => {
            tr.remove();
            reorderNumbers();
            updateTotals();
        });

        itemBody.appendChild(tr);
        reorderNumbers();
        updateTotals();
    }

    function stripCommas(str) { return str.toString().replace(/,/g, ''); }

    function reorderNumbers() {
        itemBody.querySelectorAll('tr').forEach((r, i) => r.cells[0].innerText = i + 1);
    }

    function updateTotals() {
        const rows = itemBody.querySelectorAll('tr');
        let total = 0;
        rows.forEach(r => {
            const q = parseFloat(stripCommas(r.querySelector('.item-qty').innerText)) || 0;
            const p = parseFloat(stripCommas(r.querySelector('.item-price').innerText)) || 0;
            const rowTotal = q * p;
            r.querySelector('.item-row-total').innerText = rowTotal > 0 ? rowTotal.toLocaleString('ko-KR') : '';
            total += rowTotal;
        });

        const discRate = parseFloat(discountRateInput.value) || 0;
        const discAmount = Math.floor(total * (discRate / 100));
        const final = total - discAmount;

        subtotalEl.innerText = total.toLocaleString('ko-KR');
        discountAmountEl.innerText = `- ${discAmount.toLocaleString('ko-KR')}`;
        finalTotalEl.innerText = final.toLocaleString('ko-KR');
        totalAmountTextEl.innerText = `￦ ${final.toLocaleString('ko-KR')}`;
        if (discountLabelEl) discountLabelEl.innerText = discRate;
    }

    // --- Mobile Sidebar ---
    function toggleMobileMenu() {
        if (!sidebar || !mobileOverlay) return;
        sidebar.classList.toggle('active');
        mobileOverlay.classList.toggle('active');
    }
    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    if (mobileOverlay) mobileOverlay.addEventListener('click', toggleMobileMenu);

    // --- Data Storage Logic (v3.0) ---
    const saveDataBtn = document.getElementById('saveDataBtn');
    const savedListEl = document.getElementById('savedList');
    const favoriteListEl = document.getElementById('favoriteList');

    window.antigravity_toggleFav = (id) => {
        const data = getStorageData();
        const item = data.find(i => i.id === id);
        if (item) { item.isFav = !item.isFav; setStorageData(data); }
    };

    window.antigravity_deleteItem = (id) => {
        if (confirm('삭제할까요?')) {
            const data = getStorageData().filter(i => i.id !== id);
            setStorageData(data);
        }
    };

    function getStorageData() { return JSON.parse(localStorage.getItem('inspo_quotations') || '[]'); }
    function setStorageData(data) { localStorage.setItem('inspo_quotations', JSON.stringify(data)); renderList(); }

    function renderList() {
        if (!savedListEl || !favoriteListEl) return;
        const data = getStorageData();
        savedListEl.innerHTML = ''; favoriteListEl.innerHTML = '';
        if (data.length === 0) {
            savedListEl.innerHTML = '<p class="empty-msg">내역 없음</p>';
            return;
        }
        data.reverse().forEach(item => {
            const div = document.createElement('div');
            div.className = 'saved-item';
            div.innerHTML = `<div>${item.customer || '미정'}</div>
                <div class="actions">
                    <button onclick="event.stopPropagation(); window.antigravity_toggleFav(${item.id})">${item.isFav ? '★' : '☆'}</button>
                    <button onclick="event.stopPropagation(); window.antigravity_deleteItem(${item.id})">🗑️</button>
                </div>`;
            div.onclick = () => loadQuotation(item);
            savedListEl.appendChild(div);
            if (item.isFav) favoriteListEl.appendChild(div.cloneNode(true));
        });
    }

    function loadQuotation(data) {
        if (!confirm('불러올까요?')) return;
        itemBody.innerHTML = '';
        if (data.customer) document.getElementById('customerName').innerText = data.customer;
        discountRateInput.value = data.discountRate || 0;
        data.items.forEach(i => addRow(i.name, i.option, i.qty, i.price));
        updateTotals();
    }

    if (saveDataBtn) {
        saveDataBtn.addEventListener('click', () => {
            const items = Array.from(itemBody.querySelectorAll('tr')).map(r => ({
                name: r.querySelector('.item-name').innerText,
                option: r.querySelector('.item-option').innerText,
                qty: r.querySelector('.item-qty').innerText,
                price: r.querySelector('.item-price').innerText
            }));
            const data = getStorageData();
            data.push({ id: Date.now(), customer: document.getElementById('customerName').innerText, items, discountRate: discountRateInput.value, isFav: false });
            setStorageData(data);
            alert('저장 완료!');
        });
    }

    if (typeof calculateNeededQty === 'function') calculateNeededQty();
    renderList();
});
