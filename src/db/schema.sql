-- TYPES
create type person_role as enum('user', 'moderator', 'admin');

-- TABLES
CREATE TABLE IF NOT EXISTS person
(
    id SERIAL PRIMARY KEY,
    nickname VARCHAR(255) NOT NULL UNIQUE,
    passwordhash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE DEFAULT 'undefined@gmail.com'::character varying,
    name VARCHAR(255) NOT NULL DEFAULT 'undefined'::character varying,
    surname VARCHAR(255) NOT NULL DEFAULT 'undefined'::character varying,
    sex smallint NOT NULL DEFAULT 0,
    country VARCHAR(255),
    avatar_url VARCHAR(2048),
    about VARCHAR(300),
    role person_role NOT NULL DEFAULT 'user'
);



create TABLE IF NOT EXISTS post(
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  preview VARCHAR(255) NOT NULL,
  content JSON,
  user_id INTEGER NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  community_id INTEGER,
  FOREIGN KEY (user_id) REFERENCES person (id) ON DELETE CASCADE,
  FOREIGN KEY (community_id) REFERENCES community (id) ON DELETE SET NULL
);
create TABLE IF NOT EXISTS comment(
  id SERIAL PRIMARY KEY,
  body TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  post_id INTEGER NOT NULL,
  answer_to INTEGER,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES person (id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES post (id) ON DELETE CASCADE,
  FOREIGN KEY (answer_to) REFERENCES comment(id) ON DELETE CASCADE
);
create TABLE IF NOT EXISTS post_like(
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  post_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES person (id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES post (id) ON DELETE CASCADE
);
create TABLE IF NOT EXISTS comment_like(
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  comment_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES person (id) ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES comment (id) ON DELETE CASCADE
);
create TABLE IF NOT EXISTS token(
  id SERIAL PRIMARY KEY,
  refresh_token TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES person (id) ON DELETE CASCADE
);
create table if not exists post_tag(
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL,
  tag VARCHAR(255) NOT NULL,
  FOREIGN KEY (post_id) REFERENCES post (id) ON DELETE CASCADE
);
create TABLE IF NOT EXISTS bookmark(
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  post_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES person (id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES post (id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS person_subscription(
  id SERIAL PRIMARY KEY,
  subject_id INTEGER NOT NULL,
  object_id INTEGER NOT NULL,
  FOREIGN KEY (subject_id) REFERENCES person (id) ON DELETE CASCADE,
  FOREIGN KEY (object_id) REFERENCES person (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS email_confirm(
	id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  uuid VARCHAR(255) NOT NULL,
  candidate VARCHAR(255) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES person (id)
);

CREATE TABLE IF NOT EXISTS password_reset(
	id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  uuid VARCHAR(255) NOT NULL,
  FOREIGN KEY(user_id) REFERENCES person(id)
);


CREATE TABLE IF NOT EXISTS person_ban(
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  message VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES person (id)
 );


CREATE TABLE IF NOT EXISTS community (
id
SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(2048),
  description VARCHAR(1000),
  owner_id INTEGER,
  FOREIGN KEY(owner_id) REFERENCES person (id) ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS community_subscription (
	id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  community_id INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES person(id),
  FOREIGN KEY(community_id) REFERENCES community(id)
);

--  VIEWS
CREATE OR REPLACE VIEW v_post AS
SELECT post.*,
       person.nickname AS user_nickname,
       person.avatar_url AS user_avatar_url,
       ARRAY_AGG(DISTINCT post_tag.tag) AS tags,
       count(DISTINCT post_like) AS likes_count,
       count(DISTINCT comment) AS comments_count
FROM post
INNER JOIN person ON person.id = post.user_id
LEFT JOIN post_like ON post_like.post_id = post.id
LEFT JOIN post_tag ON post_tag.post_id = post.id
LEFT JOIN comment ON comment.post_id = post.id
LEFT JOIN bookmark ON bookmark.post_id = post.id
GROUP BY post.id,
         person.id
ORDER BY post.created_at DESC;

CREATE OR REPLACE VIEW v_comment AS
SELECT comment.*,
       person.nickname AS user_nickname,
       person.avatar_url AS user_avatar_url,
       count(DISTINCT comment_like) AS likes_count
FROM COMMENT
JOIN person ON person.id = comment.user_id
LEFT JOIN comment_like ON comment_like.comment_id = comment.id
GROUP BY comment.id, person.id;

CREATE OR REPLACE VIEW v_person AS
SELECT
	person.id,
  person.name,
  person.surname,
  person.nickname,
  person.avatar_url,
  person.sex,
  person.country,
  person.about,
  COUNT(DISTINCT post.id) AS posts_count
FROM person
LEFT JOIN post ON post.user_id = person.id
GROUP BY person.id;

-- END VIEWS