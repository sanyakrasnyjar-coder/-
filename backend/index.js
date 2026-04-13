const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'database.db');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Ошибка подключения к БД:', err.message);
    } else {
        console.log('✅ Подключение к БД установлено');
        console.log(`📁 Файл БД: ${DB_PATH}`);
        initDatabase();
    }
});

function initDatabase() {
    db.run(`
        CREATE TABLE IF NOT EXISTS seminars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            time TEXT NOT NULL,
            weekdays TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('❌ Ошибка создания таблицы seminars:', err.message);
        } else {
            console.log('✅ Таблица seminars создана/проверена');
        }
    });

    // NEW: Таблица comments
    db.run(`
        CREATE TABLE IF NOT EXISTS comments (
            comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_name TEXT NOT NULL,
            user_email TEXT NOT NULL,
            user_comment TEXT NOT NULL,
            user_image_path TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('❌ Ошибка создания таблицы comments:', err.message);
        } else {
            console.log('✅ Таблица comments создана/проверена');
            addTestData(); // заполняем обе таблицы тестовыми данными после создания
        }
    });
}

function addTestData() {
    // --- СЕМИНАРЫ (существующая логика) ---
    db.get('SELECT COUNT(*) as count FROM seminars', [], (err, row) => {
        if (err) {
            console.error('❌ Ошибка проверки seminars:', err.message);
            return;
        }

        if (row.count === 0) {
            console.log('📝 Добавляем тестовые семинары...');

            const testSeminars = [
                ['Введение в JavaScript', '10:00', 'ПН,СР,ПТ'],
                ['React для начинающих', '14:30', 'ВТ,ЧТ'],
                ['Node.js и базы данных', '18:00', 'ПН,ПТ'],
                ['TypeScript: основы', '09:00', 'ПН,СР'],
                ['Веб-дизайн и UX/UI', '11:00', 'СР,ЧТ'],
                ['Python для анализа данных', '15:00', 'ВТ,ЧТ,СБ'],
                ['Мобильная разработка на Flutter', '16:00', 'ВТ,СР'],
                ['Git и CI/CD', '13:00', 'ПН,ЧТ'],
                ['Docker для разработчиков', '17:00', 'СР,ПТ'],
                ['Английский для IT', '08:30', 'ВТ,ЧТ,ПТ']
            ];

            const insertStmt = db.prepare(`
                INSERT INTO seminars (title, time, weekdays)
                VALUES (?, ?, ?)
            `);

            testSeminars.forEach(seminar => {
                insertStmt.run(seminar, function(err) {
                    if (err) {
                        console.error('❌ Ошибка добавления семинара:', err.message);
                    }
                });
            });

            insertStmt.finalize();
            console.log(`✅ Добавлено ${testSeminars.length} тестовых семинаров`);
        } else {
            console.log(`ℹ️ В таблице seminars уже есть ${row.count} записей`);
        }
    });

    // NEW: --- КОММЕНТАРИИ (тестовые данные) ---
    db.get('SELECT COUNT(*) as count FROM comments', [], (err, row) => {
        if (err) {
            console.error('❌ Ошибка проверки comments:', err.message);
            return;
        }

        if (row.count === 0) {
            console.log('📝 Добавляем тестовые комментарии...');

            const testComments = [
                ['Skillet', 'Skillet@mail.ru', 'Курс очень привлекателен, материал структурирован, без пробелов! Предоставляю - настоящее профессиональное, умеет работать с любыми формами работы и в любой области.', './i5.png'],
                ['Gats', 'gs@mail.ru', 'Впечатления исключительно положительные. Программа очень насыщенная и, что самое важное, актуальная – учтены все последние тренды 2025–2026 года.', './i3.png'],
                ['Kaska', 'ks@gmail.com', 'Добрый день, знания полученные на вашем курсе помогли мне в работе. Спасибо вам огромное.', './i6.png'],
                ['Griff', 'gf@gmail.com', 'Спасибо за познавательный и развивающий курс! Было много полезной для меня информации. Материал буду использовать при работе с детьми с ОВЗ.', './i4.png']
            ];

            const insertStmt = db.prepare(`
                INSERT INTO comments (user_name, user_email, user_comment, user_image_path)
                VALUES (?, ?, ?, ?)
            `);

            testComments.forEach(comment => {
                insertStmt.run(comment, function(err) {
                    if (err) {
                        console.error('❌ Ошибка добавления комментария:', err.message);
                    }
                });
            });

            insertStmt.finalize();
            console.log(`✅ Добавлено ${testComments.length} тестовых комментариев`);
        } else {
            console.log(`ℹ️ В таблице comments уже есть ${row.count} записей`);
        }
    });
}

// ========== ЭНДПОИНТЫ ДЛЯ СЕМИНАРОВ (без изменений) ==========
app.get('/api/seminars', (req, res) => {
    const sql = `SELECT * FROM seminars ORDER BY time, title`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('❌ Ошибка получения семинаров:', err.message);
            res.status(500).json({ error: 'Ошибка получения данных', message: err.message });
        } else {
            console.log(`📊 Отправлено ${rows.length} семинаров`);
            res.json(rows);
        }
    });
});

app.get('/api/seminars/day/:day', (req, res) => {
    const day = req.params.day.toUpperCase();
    const sql = `SELECT * FROM seminars WHERE weekdays LIKE ? ORDER BY time`;
    db.all(sql, [`%${day}%`], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

app.get('/api/seminars/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM seminars WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.status(404).json({ error: 'Семинар не найден' });
        } else {
            res.json(row);
        }
    });
});

app.get('/api/stats', (req, res) => {
    const stats = {};
    db.serialize(() => {
        db.get('SELECT COUNT(*) as total FROM seminars', [], (err, row) => {
            stats.total = row?.total || 0;
        });
        db.all(`
            SELECT substr(weekdays, 1, 2) as day, COUNT(*) as count
            FROM seminars
            GROUP BY day
            ORDER BY count DESC
        `, [], (err, rows) => {
            stats.byDay = rows || [];
            setTimeout(() => res.json(stats), 100);
        });
    });
});

// ========== НОВЫЕ ЭНДПОИНТЫ ДЛЯ КОММЕНТАРИЕВ ==========

// GET /api/comments – получить все комментарии
app.get('/api/comments', (req, res) => {
    const sql = `SELECT * FROM comments ORDER BY created_at DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('❌ Ошибка получения комментариев:', err.message);
            res.status(500).json({ error: 'Ошибка получения комментариев', message: err.message });
        } else {
            res.json(rows);
        }
    });
});

// GET /api/comments/random4 – получить 4 случайных комментария
app.get('/api/comments/random4', (req, res) => {
    const sql = `SELECT * FROM comments ORDER BY RANDOM() LIMIT 4`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('❌ Ошибка получения случайных комментариев:', err.message);
            res.status(500).json({ error: 'Ошибка получения комментариев', message: err.message });
        } else {
            res.json(rows);
        }
    });
});

// GET /api/comments/:id – получить комментарий по ID
app.get('/api/comments/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM comments WHERE comment_id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.status(404).json({ error: 'Комментарий не найден' });
        } else {
            res.json(row);
        }
    });
});

// POST /api/comments – добавить новый комментарий
app.post('/api/comments', (req, res) => {
    const { user_name, user_email, user_comment, user_image_path } = req.body;

    // Простейшая валидация
    if (!user_name || !user_email || !user_comment) {
        return res.status(400).json({ error: 'Поля user_name, user_email и user_comment обязательны' });
    }

    const sql = `
        INSERT INTO comments (user_name, user_email, user_comment, user_image_path)
        VALUES (?, ?, ?, ?)
    `;
    db.run(sql, [user_name, user_email, user_comment, user_image_path || null], function(err) {
        if (err) {
            console.error('❌ Ошибка добавления комментария:', err.message);
            res.status(500).json({ error: 'Ошибка добавления комментария', message: err.message });
        } else {
            // Возвращаем созданную запись (можно также вернуть только ID)
            db.get('SELECT * FROM comments WHERE comment_id = ?', [this.lastID], (err, row) => {
                if (err) {
                    res.status(201).json({ comment_id: this.lastID });
                } else {
                    res.status(201).json(row);
                }
            });
        }
    });
});



// Запуск сервера
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    console.log(`📁 Статические файлы: ./public`);
    console.log(`💾 База данных: ${DB_PATH}`);
    console.log('='.repeat(50) + '\n');
});

// Закрытие соединения с БД при завершении процесса
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('❌ Ошибка закрытия БД:', err.message);
        } else {
            console.log('\n👋 Соединение с БД закрыто');
        }
        process.exit(0);
    });
});

module.exports = { db, app };