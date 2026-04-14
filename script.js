async function loadAppData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to load app data:', error);
        return null;
    }
}

function factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
}

class Calculator {
    constructor(precision, defaultMode) {
        this.expression = '';
        this.result = '0';
        this.mode = defaultMode || 'deg'; // 'deg' or 'rad'
        this.precision = precision || 10;
        this.isNewCalculation = true;
    }

    appendNumber(number) {
        if (this.isNewCalculation) {
            this.expression = number === '.' ? '0.' : number;
            this.isNewCalculation = false;
        } else {
            this.expression += number;
        }
        this.updateDisplay();
    }

    appendOperator(operator) {
        if (this.isNewCalculation) {
            this.expression = this.result + operator;
            this.isNewCalculation = false;
        } else {
            this.expression += operator;
        }
        this.updateDisplay();
    }

    appendFunction(fn) {
        if (this.isNewCalculation) {
            this.expression = fn + '(';
            this.isNewCalculation = false;
        } else {
            this.expression += fn + '(';
        }
        this.updateDisplay();
    }

    appendBracket(bracket) {
        if (this.isNewCalculation) {
            this.expression = bracket;
            this.isNewCalculation = false;
        } else {
            this.expression += bracket;
        }
        this.updateDisplay();
    }

    appendConstant(constant) {
        const value = constant === 'pi' ? 'π' : 'e';
        if (this.isNewCalculation) {
            this.expression = value;
            this.isNewCalculation = false;
        } else {
            this.expression += value;
        }
        this.updateDisplay();
    }

    clear() {
        this.expression = '';
        this.result = '0';
        this.isNewCalculation = true;
        this.updateDisplay();
    }

    delete() {
        if (this.expression.length > 0) {
            this.expression = this.expression.slice(0, -1);
            if (this.expression === '') {
                this.isNewCalculation = true;
                this.result = '0';
            }
        }
        this.updateDisplay();
    }

    toggleMode() {
        this.mode = this.mode === 'deg' ? 'rad' : 'deg';
        document.getElementById('mode-indicator').textContent = this.mode.toUpperCase();
    }

    calculate() {
        try {
            let evalExpr = this.expression
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/π/g, 'Math.PI')
                .replace(/e/g, 'Math.E')
                .replace(/\^/g, '**')
                .replace(/ln\(/g, 'Math.log(')
                .replace(/log\(/g, 'Math.log10(')
                .replace(/sqrt\(/g, 'Math.sqrt(')
                .replace(/abs\(/g, 'Math.abs(')
                .replace(/fact\(/g, 'factorial(');

            // Create a scoped evaluation with custom trig functions
            const degToRad = (val) => val * Math.PI / 180;
            const radToDeg = (val) => val * 180 / Math.PI;

            const sin = (x) => this.mode === 'deg' ? Math.sin(degToRad(x)) : Math.sin(x);
            const cos = (x) => this.mode === 'deg' ? Math.cos(degToRad(x)) : Math.cos(x);
            const tan = (x) => this.mode === 'deg' ? Math.tan(degToRad(x)) : Math.tan(x);
            const asin = (x) => this.mode === 'deg' ? radToDeg(Math.asin(x)) : Math.asin(x);
            const acos = (x) => this.mode === 'deg' ? radToDeg(Math.acos(x)) : Math.acos(x);
            const atan = (x) => this.mode === 'deg' ? radToDeg(Math.atan(x)) : Math.atan(x);

            // Wrap eval in a function that provides these helpers as locals
            const resultFunc = new Function('sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'factorial', `return ${evalExpr}`);
            let res = resultFunc(sin, cos, tan, asin, acos, atan, factorial);

            if (isNaN(res) || !isFinite(res)) {
                this.result = 'Error';
            } else {
                // Format result
                if (res.toString().includes('.')) {
                    this.result = parseFloat(res.toFixed(this.precision)).toString();
                } else {
                    this.result = res.toString();
                }
            }

            this.isNewCalculation = true;
            this.updateDisplay(true);
        } catch (error) {
            console.error(error);
            this.result = 'Error';
            this.isNewCalculation = true;
            this.updateDisplay(true);
        }
    }

    updateDisplay(showResult = false) {
        document.getElementById('expression-display').textContent = this.expression;
        if (showResult || this.isNewCalculation) {
            document.getElementById('result-display').textContent = this.result;
        }
    }
}

async function init() {
    const data = await loadAppData();
    if (!data) return;

    const settings = data.sections.app_settings;
    const config = data.sections.calculator_config;

    // Apply Styles
    document.documentElement.style.setProperty('--primary-color', settings.primary_color.value);
    document.documentElement.style.setProperty('--secondary-color', settings.secondary_color.value);
    document.documentElement.style.setProperty('--background-color', settings.background_color.value);
    document.documentElement.style.setProperty('--text-color', settings.text_color.value);
    document.documentElement.style.setProperty('--button-text-color', settings.button_text_color.value);

    // Apply App Name
    document.getElementById('app-name').textContent = settings.app_name.value;

    // Initialize Calculator
    const calc = new Calculator(config.precision.value, config.default_angle_unit.value);
    document.getElementById('mode-indicator').textContent = calc.mode.toUpperCase();

    // Event Listeners
    document.querySelectorAll('.key').forEach(key => {
        key.addEventListener('click', () => {
            const action = key.dataset.action;
            const value = key.dataset.value || key.textContent;

            if (key.classList.contains('number')) {
                calc.appendNumber(value);
            } else if (key.classList.contains('operator')) {
                calc.appendOperator(value);
            } else {
                switch (action) {
                    case 'clear':
                        calc.clear();
                        break;
                    case 'delete':
                        calc.delete();
                        break;
                    case 'function':
                        calc.appendFunction(value);
                        break;
                    case 'constant':
                        calc.appendConstant(value);
                        break;
                    case 'bracket':
                        calc.appendBracket(value);
                        break;
                    case 'toggle-mode':
                        calc.toggleMode();
                        break;
                    case 'calculate':
                        calc.calculate();
                        break;
                }
            }
        });
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (e.key >= '0' && e.key <= '9') calc.appendNumber(e.key);
        if (e.key === '.') calc.appendNumber('.');
        if (['+', '-', '*', '/'].includes(e.key)) calc.appendOperator(e.key === '*' ? '×' : e.key === '/' ? '÷' : e.key);
        if (e.key === 'Enter' || e.key === '=') calc.calculate();
        if (e.key === 'Backspace') calc.delete();
        if (e.key === 'Escape') calc.clear();
        if (e.key === '(' || e.key === ')') calc.appendBracket(e.key);
    });

    // Reveal App
    document.getElementById('app-container').classList.add('loaded');
}

document.addEventListener('DOMContentLoaded', init);
