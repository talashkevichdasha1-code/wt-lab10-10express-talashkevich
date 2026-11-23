
const express = require("express");
const pool = require("./db");

const app = express();
const port = process.env.PORT || 3000;

// Middleware для обработки JSON
app.use(express.json());

// Главная страница
app.get("/", (req, res) => {
    res.send("Fitness Club API работает!");
});

// Информация о приложении
app.get("/api/info", (req, res) => {
    res.json({
        application: "Fitness Club",
        technology: "Node.js + Express",
        database: "PostgreSQL"
    });
});

// Проверка получения JSON
app.post("/api/test", (req, res) => {
    res.json({
        message: "Данные получены",
        data: req.body
    });
});

// Проверка подключения к PostgreSQL
app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT NOW() AS current_time"
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Ошибка подключения к базе данных"
        });
    }
});

// Получение всех участников
app.get("/api/members", async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM "Members" ORDER BY "Id"'
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Ошибка получения списка участников"
        });
    }
});

// ПОИСК УЧАСТНИКОВ ПО ИМЕНИ
// ВАЖНО: этот маршрут должен находиться выше /:id
app.get("/api/members/search", async (req, res) => {
    try {
        const search = req.query.name;

        if (!search || !search.trim()) {
            return res.status(400).json({
                error: "Укажите имя для поиска"
            });
        }

        const result = await pool.query(
            `SELECT * FROM "Members"
             WHERE "Name" ILIKE $1
             ORDER BY "Id"`,
            [`%${search.trim()}%`]
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Ошибка поиска участников"
        });
    }
});

// Получение участника по ID
app.get("/api/members/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error: "Некорректный ID участника"
            });
        }

        const result = await pool.query(
            'SELECT * FROM "Members" WHERE "Id" = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Участник не найден"
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Ошибка получения участника"
        });
    }
});

// Добавление нового участника
app.post("/api/members", async (req, res) => {
    try {
        const {
            Name,
            Age,
            MembershipPlanId,
            TrainerId,
            IsActive,
            Description
        } = req.body;

        if (
            !Name ||
            !Number.isInteger(Age) ||
            Age <= 0 ||
            !Number.isInteger(MembershipPlanId) ||
            !Number.isInteger(TrainerId) ||
            typeof IsActive !== "boolean"
        ) {
            return res.status(400).json({
                error: "Проверьте правильность переданных данных"
            });
        }

        const result = await pool.query(
            `INSERT INTO "Members"
            ("Name", "Age", "MembershipPlanId", "TrainerId", "IsActive", "Description")
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
                Name,
                Age,
                MembershipPlanId,
                TrainerId,
                IsActive,
                Description || ""
            ]
        );

        res.status(201).json({
            message: "Участник успешно добавлен",
            member: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Ошибка добавления участника"
        });
    }
});

// Обновление данных участника
app.put("/api/members/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        const {
            Name,
            Age,
            MembershipPlanId,
            TrainerId,
            IsActive,
            Description
        } = req.body;

        if (
            !Number.isInteger(id) ||
            id <= 0 ||
            !Name ||
            !Number.isInteger(Age) ||
            Age <= 0 ||
            !Number.isInteger(MembershipPlanId) ||
            !Number.isInteger(TrainerId) ||
            typeof IsActive !== "boolean"
        ) {
            return res.status(400).json({
                error: "Проверьте правильность переданных данных"
            });
        }

        const result = await pool.query(
            `UPDATE "Members"
             SET "Name" = $1,
                 "Age" = $2,
                 "MembershipPlanId" = $3,
                 "TrainerId" = $4,
                 "IsActive" = $5,
                 "Description" = $6
             WHERE "Id" = $7
             RETURNING *`,
            [
                Name,
                Age,
                MembershipPlanId,
                TrainerId,
                IsActive,
                Description || "",
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Участник не найден"
            });
        }

        res.json({
            message: "Данные участника обновлены",
            member: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Ошибка обновления участника"
        });
    }
});

// Удаление участника
app.delete("/api/members/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error: "Некорректный ID участника"
            });
        }

        const result = await pool.query(
            'DELETE FROM "Members" WHERE "Id" = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Участник не найден"
            });
        }

        res.json({
            message: "Участник успешно удалён",
            member: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Ошибка удаления участника"
        });
    }
});

// Запуск сервера
app.listen(port, "0.0.0.0", () => {
    console.log(`Server started on port ${port}`);
});
