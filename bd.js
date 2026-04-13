const API_BASE = 'http://localhost:3000/api';

async function getAllSeminars() {
    try {
        const response = await fetch(`${API_BASE}/seminars`);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки семинаров:', error);
        throw error;
    }
}

async function displaySeminars() {
    const tbody = document.querySelector('.seminars-list');
    if (!tbody) {
        console.error('Элемент .seminars-list не найден');
        return;
    }

    tbody.innerHTML = `
        <tr class="loading-row">
            <td colspan="3" class="loading">Загрузка семинаров...</td>
        </tr>
    `;

    try {
        const seminars = await getAllSeminars();

        const countEl = document.getElementById('seminarCount');
        if (countEl) countEl.textContent = `${seminars.length} шт.`;

        if (!seminars || seminars.length === 0) {
            tbody.innerHTML = `
                <tr class="no-seminars-row">
                    <td colspan="3" class="no-seminars">Нет запланированных семинаров</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = `<thead>
                <tr>
                  <th class="col-name">Название семинара</th>
                  <th class="col-time">Время</th>
                  <th class="col-days">Дни недели</th>
                </tr>
              </thead>`;

        seminars.forEach(seminar => {
            const row = document.createElement('tr');
            row.className = 'seminar-row';

            const nameCell = document.createElement('td');
            nameCell.className = 'seminar-name';
            nameCell.textContent = seminar.title || seminar.название || '';

            const timeCell = document.createElement('td');
            timeCell.className = 'seminar-time';
            timeCell.textContent = seminar.time || seminar.время || '';

            const daysCell = document.createElement('td');
            daysCell.className = 'seminar-days';
            const daysStr = seminar.weekdays || seminar.дни_недели || '';
            daysCell.textContent = daysStr.split(',').map(day => day.trim()).join(', ');

            row.appendChild(nameCell);
            row.appendChild(timeCell);
            row.appendChild(daysCell);
            tbody.appendChild(row);
        });

        console.log(`Отображено ${seminars.length} семинаров`);

    } catch (error) {
        tbody.innerHTML = `
            <tr class="error-row">
                <td colspan="3" class="error">
                    Ошибка загрузки семинаров: ${error.message}
                </td>
            </tr>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Страница загружена, запрашиваем семинары...');
    displaySeminars();
});

window.displaySeminars = displaySeminars;