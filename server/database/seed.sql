-- data Sample for testing
-- Default password for these users (inject): password123

INSERT INTO users (username, email, password) VALUES 
('lukas', 'lukas@gmail.com', '$2b$10$apeyKy9kZoKtHvzQW9YX8OR/lkDSjqxd6E0xdgoEzEJkWIu.RCSt.'),
('kinetixpro', 'kinetixpro@gmail.com', '$2b$10$apeyKy9kZoKtHvzQW9YX8OR/lkDSjqxd6E0xdgoEzEJkWIu.RCSt.'),
('talentgrowth', 'talentgrowth@gmail.com', '$2b$10$apeyKy9kZoKtHvzQW9YX8OR/lkDSjqxd6E0xdgoEzEJkWIu.RCSt.');

INSERT INTO posts (title, caption, image, likes, author_id) VALUES 
('Welcome to KinetixPro', 'This is my first post on KinetixPro! Excited to share my journey.', 'https://picsum.photos/600/400?random=1', 42, 1),
('Beautiful Sunset', 'Captured this amazing sunset today 🌅', 'https://picsum.photos/600/400?random=2', 128, 1),
('Coffee Time', 'Starting my day with a perfect cup of coffee ☕', 'https://picsum.photos/600/400?random=3', 85, 2),
('Tech Talk', 'Just finished an amazing webinar on cloud computing!', NULL, 56, 2),
('Weekend Vibes', 'Enjoying the weekend with family 👨‍👩‍👧‍👦', 'https://picsum.photos/600/400?random=4', 93, 3),
('New Project', 'Excited to announce my new project launching soon! 🚀', NULL, 67, 3);

INSERT INTO comments (content, post_id, user_id) VALUES 
('Great post! Love it!', 1, 2),
('This is amazing! Thanks for sharing.', 1, 3),
('Wow, that sunset is breathtaking!', 2, 2),
('I need this kind of coffee right now!', 3, 1),
('Sounds interesting! Can you share more details?', 4, 3),
('Have a great weekend!', 5, 1),
('Can''t wait to see what you''ve built!', 6, 2);

SELECT 'Data seeded successfully!' AS status;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_posts FROM posts;
SELECT COUNT(*) AS total_comments FROM comments;
