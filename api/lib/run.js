class Run {
    constructor() {
        this.attrs = ['id', 'created', 'github', 'closed'];
        this.id = false;
        this.created = false;
        this.github = {};
        this.closed = false;
    }

    /**
     * Return all associated jobs for a given run
     */
    static jobs(pool) {
        return new Promise((resolve, reject) => {
            pool.query(`
                SELECT
                    *
                FROM
                    jobs
                WHERE
                    jobs.run = $1::UUID
            `, [run.id], (err, pgres) => {
                if (err) return reject(err);

                return resolve(pgres.rows);
            });
        });
    }

    static from(pool, id) {
        new Promise((resolve, reject) => {
            pool.query(`
                SELECT
                    *
                FROM
                    runs
                WHERE
                    id = $1
            `, [id], (err, pgres) => {
                if (err) return reject(err);

                const run = new Run();

                for (const key of Object.keys(pgres.rows[0])) {
                    run[key] = pgres.rows[0][key];
                }

                return resolve(run);
            });
        });
    }

    json() {
        return {
            id: this.id,
            created: this.created,
            github: this.github,
            closed: this.closed
        };
    }

    patch(patch) {
        for (const attr of this.attrs) {
            if (patch[attr] !== undefined) {
                this[attr] = patch[attr];
            }
        }
    }

    commit(pool) {
        return new Promise((resolve, reject) => {
            pool.query(`
                UPDATE runs
                    SET
                        github = $1,
                        closed = $2
                    RETURNING *
           `, [ this.github, this.closed ], (err, pgres) => {
                if (err) return reject(err);

                return resolve(pgres.rows[0]);
           });
       });
    }

    static generate(pool) {
        return new Promise((resolve, reject) => {
            pool.query(`
                INSERT INTO runs (
                    id,
                    created,
                    github,
                    closed
                ) VALUES (
                    uuid_generate_v4(),
                    NOW(),
                    '{}'::JSONB,
                    false
                ) RETURNING *
            `, (err, pgres) => {
                if (err) return reject(err);

                const run = new Run();

                for (const key of Object.keys(pgres.rows[0])) {
                    run[key] = pgres.rows[0][key];
                }

                return resolve(run);
            });
        });
    }
}

module.exports = Run;
