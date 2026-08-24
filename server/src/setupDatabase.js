const pool = require("./database");

const createTables = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL
          CHECK (role IN ('admin', 'school', 'teacher', 'parent')),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS school_requests (
        id SERIAL PRIMARY KEY,
        association_name VARCHAR(255) NOT NULL,
        club_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        wilaya VARCHAR(100) NOT NULL,
        municipality VARCHAR(100) NOT NULL,
        district VARCHAR(150) NOT NULL,
        inside_image_url TEXT,
        outside_image_url TEXT,
        password_hash TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'approved', 'rejected')),
        reviewed_at TIMESTAMP,
        rejection_reason TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS schools (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id)
          ON DELETE CASCADE,
        association_name VARCHAR(255) NOT NULL,
        club_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        wilaya VARCHAR(100) NOT NULL,
        municipality VARCHAR(100) NOT NULL,
        district VARCHAR(150) NOT NULL,
        inside_image_url TEXT,
        outside_image_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS teachers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id)
          ON DELETE CASCADE,
        school_id INTEGER NOT NULL REFERENCES schools(id)
          ON DELETE CASCADE,
        teacher_code VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS parents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id)
          ON DELETE CASCADE,
        full_name VARCHAR(255) NOT NULL,
        birth_date DATE,
        residence VARCHAR(255),
        phone VARCHAR(50),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        school_id INTEGER NOT NULL REFERENCES schools(id)
          ON DELETE CASCADE,
        teacher_id INTEGER REFERENCES teachers(id)
          ON DELETE SET NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        birth_date DATE,
        birth_place VARCHAR(150),
        residence VARCHAR(255),
        guardian_name VARCHAR(255),
        guardian_phone VARCHAR(50),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS parent_children (
        parent_id INTEGER NOT NULL REFERENCES parents(id)
          ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES students(id)
          ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (parent_id, student_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id)
          ON DELETE CASCADE,
        attendance_date DATE NOT NULL,
        period VARCHAR(20) NOT NULL
          CHECK (period IN ('morning', 'evening')),
        present BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (student_id, attendance_date, period)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS memorization (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id)
          ON DELETE CASCADE,
        memorization_date DATE NOT NULL,
        surah VARCHAR(100),
        from_ayah INTEGER,
        to_ayah INTEGER,
        amount VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS teacher_notes (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id)
          ON DELETE CASCADE,
        teacher_id INTEGER NOT NULL REFERENCES teachers(id)
          ON DELETE CASCADE,
        note TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_students_school_id
      ON students(school_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_students_teacher_id
      ON students(teacher_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_attendance_student_id
      ON attendance(student_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_memorization_student_id
      ON memorization(student_id);
    `);

    await client.query("COMMIT");

    console.log("Database tables created successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Database setup failed:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

createTables();