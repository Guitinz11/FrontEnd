// Função para logout
function logout() {
    localStorage.removeItem('userLoggedIn');
    window.location.href = 'index.html';
}

// Função para verificar autenticação
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('userLoggedIn') || '{}');
    return user.email ? user : null;
}

// Função para redirecionar para login se não autenticado
function requireAuth() {
    if (!checkAuth()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Função para formatar tempo
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}:${secs}`;
}

// Função para formatar data
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Smooth scroll para links internos
document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // Close modals on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });

    // Close modals on outside click
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
});

// Notificação Toast (simples)
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
        color: white;
        border-radius: 8px;
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Função para validar email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Função para validar senha
function validatePassword(password) {
    return password.length >= 6;
}

// Local storage helpers
const StorageHelper = {
    setUser: (user) => {
        localStorage.setItem('userLoggedIn', JSON.stringify(user));
    },
    getUser: () => {
        return JSON.parse(localStorage.getItem('userLoggedIn') || '{}');
    },
    clearUser: () => {
        localStorage.removeItem('userLoggedIn');
    },
    setData: (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    },
    getData: (key) => {
        return JSON.parse(localStorage.getItem(key) || 'null');
    }
};

// Função para exportar dados (simula download)
function exportToCSV(data, filename = 'export.csv') {
    let csv = '';
    
    // Headers
    if (data.length > 0) {
        csv += Object.keys(data[0]).join(',') + '\n';
        
        // Data rows
        data.forEach(row => {
            csv += Object.values(row).join(',') + '\n';
        });
    }
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Print utilities
function printElement(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const originalVisible = element.style.display;
    const printWindow = window.open('', '', 'height=400,width=600');
    printWindow.document.write(element.outerHTML);
    printWindow.document.close();
    printWindow.print();
}

// Função para animar números
function animateNumber(element, target, duration = 1000) {
    let current = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Debounce helper
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

// Throttle helper
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Currency formatter
function formatCurrency(value, currency = 'BRL') {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: currency
    }).format(value);
}

// Notification sound (opcional)
function playSound(type = 'success') {
    // Sons podem ser adicionados aqui
    // Usando apenas visual feedback por enquanto
    console.log(`Sound: ${type}`);
}

// Dark mode toggle (opcional para o futuro)
function toggleDarkMode() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('darkMode', !JSON.parse(localStorage.getItem('darkMode') || 'true'));
}

console.log('RaceFlow Frontend Loaded');
