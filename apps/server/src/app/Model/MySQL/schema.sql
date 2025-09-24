CREATE DATABASE IF NOT EXISTS magicaldb;
USE magicaldb;

CREATE Table IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255),
    email TEXT,
    password VARCHAR(255),
    created_at TIMESTAMP  DEFAULT NOW()
);


CREATE Table IF NOT EXISTS refreshTokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    token VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE Table IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    user_id INT,
    created_at TIMESTAMP DEFAULT NOW()
);

UPDATE users SET username = 'testuser' WHERE email = 'test@test.com';
