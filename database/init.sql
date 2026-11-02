--
-- PostgreSQL database dump
--

\restrict XyzCSprM4a0nGhqz4ySl0OiTwGWTBbtFfVyk1G2OdUNRwCr4yC1jcIly7qt7PVY

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.account_requests DROP CONSTRAINT IF EXISTS fksmw9cu2ssqogtrhr671chru1v;
ALTER TABLE IF EXISTS ONLY public.wellness_hubs DROP CONSTRAINT IF EXISTS fkpos7jk4c117pn4mst9vnxbbag;
ALTER TABLE IF EXISTS ONLY public.main_route_details DROP CONSTRAINT IF EXISTS fknx7y7eggm69k4b0no9ynh1igh;
ALTER TABLE IF EXISTS ONLY public.main_route_categories DROP CONSTRAINT IF EXISTS fkktay8hf7a6ehkl6r4wihvv9x2;
ALTER TABLE IF EXISTS ONLY public.emergency_services DROP CONSTRAINT IF EXISTS fkfqojsial8e5kxo102ny0u713;
ALTER TABLE IF EXISTS ONLY public.emergency_services DROP CONSTRAINT IF EXISTS fkab45o9hfl80u5nfd30certu5n;
ALTER TABLE IF EXISTS ONLY public.wellness_hubs DROP CONSTRAINT IF EXISTS fk9xgpucocelyri1a536cn26rya;
ALTER TABLE IF EXISTS ONLY public.account_requests DROP CONSTRAINT IF EXISTS fk7w7jgj92rmkp7bb0vl0cg4555;
ALTER TABLE IF EXISTS ONLY public.main_route_categories DROP CONSTRAINT IF EXISTS fk6sodk7if1nvjjoo1umyjo2199;
ALTER TABLE IF EXISTS ONLY public.notification DROP CONSTRAINT IF EXISTS fk5wqygwhh84f4eaw9rug9yibvb;
ALTER TABLE IF EXISTS ONLY public.main_route_details DROP CONSTRAINT IF EXISTS fk4qgpqpuxs927cw82ui1918hdn;
DROP INDEX IF EXISTS public.idx_wellness_hubs_status;
DROP INDEX IF EXISTS public.idx_wellness_hubs_name;
DROP INDEX IF EXISTS public.idx_wellness_hubs_district;
DROP INDEX IF EXISTS public.idx_wellness_hubs_category;
DROP INDEX IF EXISTS public.idx_official_articles_publish_date;
DROP INDEX IF EXISTS public.idx_official_articles_category;
DROP INDEX IF EXISTS public.idx_notification_status;
DROP INDEX IF EXISTS public.idx_notification_request_id;
DROP INDEX IF EXISTS public.idx_emergency_status;
DROP INDEX IF EXISTS public.idx_emergency_name;
DROP INDEX IF EXISTS public.idx_emergency_district;
DROP INDEX IF EXISTS public.idx_emergency_category;
DROP INDEX IF EXISTS public.idx_account_requests_username;
DROP INDEX IF EXISTS public.idx_account_requests_status;
DROP INDEX IF EXISTS public.idx_account_requests_license_status;
ALTER TABLE IF EXISTS ONLY public.wellness_hubs DROP CONSTRAINT IF EXISTS wellness_hubs_pkey;
ALTER TABLE IF EXISTS ONLY public.operating_hours DROP CONSTRAINT IF EXISTS operating_hours_pkey;
ALTER TABLE IF EXISTS ONLY public.official_articles DROP CONSTRAINT IF EXISTS official_articles_pkey;
ALTER TABLE IF EXISTS ONLY public.notification DROP CONSTRAINT IF EXISTS notification_pkey;
ALTER TABLE IF EXISTS ONLY public.my_travel_trip DROP CONSTRAINT IF EXISTS my_travel_trip_pkey;
ALTER TABLE IF EXISTS ONLY public.my_travel_trip_detail DROP CONSTRAINT IF EXISTS my_travel_trip_detail_pkey;
ALTER TABLE IF EXISTS ONLY public.member DROP CONSTRAINT IF EXISTS member_pkey;
ALTER TABLE IF EXISTS ONLY public.main_routes DROP CONSTRAINT IF EXISTS main_routes_pkey;
ALTER TABLE IF EXISTS ONLY public.main_route_details DROP CONSTRAINT IF EXISTS main_route_details_pkey;
ALTER TABLE IF EXISTS ONLY public.main_route_categories DROP CONSTRAINT IF EXISTS main_route_categories_pkey;
ALTER TABLE IF EXISTS ONLY public.emergency_services DROP CONSTRAINT IF EXISTS emergency_services_pkey;
ALTER TABLE IF EXISTS ONLY public.districts DROP CONSTRAINT IF EXISTS districts_pkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE IF EXISTS ONLY public.article DROP CONSTRAINT IF EXISTS article_pkey;
ALTER TABLE IF EXISTS ONLY public.admins DROP CONSTRAINT IF EXISTS admins_pkey;
ALTER TABLE IF EXISTS ONLY public.account_requests DROP CONSTRAINT IF EXISTS account_requests_pkey;
ALTER TABLE IF EXISTS public.operating_hours ALTER COLUMN oph_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.official_articles ALTER COLUMN article_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.notification ALTER COLUMN notification_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.my_travel_trip ALTER COLUMN travel_trip_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.member ALTER COLUMN member_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.main_routes ALTER COLUMN route_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.main_route_details ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.article ALTER COLUMN article_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.account_requests ALTER COLUMN request_id DROP DEFAULT;
DROP TABLE IF EXISTS public.wellness_hubs;
DROP SEQUENCE IF EXISTS public.operating_hours_oph_id_seq;
DROP TABLE IF EXISTS public.operating_hours;
DROP SEQUENCE IF EXISTS public.official_articles_article_id_seq;
DROP TABLE IF EXISTS public.official_articles;
DROP SEQUENCE IF EXISTS public.notification_notification_id_seq;
DROP TABLE IF EXISTS public.notification;
DROP SEQUENCE IF EXISTS public.my_travel_trip_travel_trip_id_seq;
DROP TABLE IF EXISTS public.my_travel_trip_detail;
DROP TABLE IF EXISTS public.my_travel_trip;
DROP SEQUENCE IF EXISTS public.member_member_id_seq;
DROP TABLE IF EXISTS public.member;
DROP SEQUENCE IF EXISTS public.main_routes_route_id_seq;
DROP TABLE IF EXISTS public.main_routes;
DROP SEQUENCE IF EXISTS public.main_route_details_id_seq;
DROP TABLE IF EXISTS public.main_route_details;
DROP TABLE IF EXISTS public.main_route_categories;
DROP TABLE IF EXISTS public.favorite_wellness_hub;
DROP TABLE IF EXISTS public.emergency_services;
DROP TABLE IF EXISTS public.districts;
DROP TABLE IF EXISTS public.categories;
DROP SEQUENCE IF EXISTS public.article_article_id_seq;
DROP TABLE IF EXISTS public.article;
DROP TABLE IF EXISTS public.admins;
DROP SEQUENCE IF EXISTS public.account_requests_request_id_seq;
DROP TABLE IF EXISTS public.account_requests;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_requests (
    request_id integer NOT NULL,
    requester_name character varying(255) NOT NULL,
    user_email character varying(255) NOT NULL,
    contact_information character varying(255),
    tell_information character varying(10),
    username character varying(100) NOT NULL,
    password character varying(100) NOT NULL,
    license_id character varying(100),
    wellness_hub_name character varying(255) NOT NULL,
    address character varying(255) NOT NULL,
    google_maps_link text,
    wellness_hub_description text,
    wellness_hub_img text,
    wellness_hub_gallery text,
    wellness_hub_latitude double precision,
    wellness_hub_longitude double precision,
    certificate_type text,
    operating_hours text,
    verification_documents text,
    request_status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    rejection_reason character varying(255),
    processed_date timestamp without time zone,
    category_id character varying(10),
    district_id integer
);


--
-- Name: account_requests_request_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.account_requests_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: account_requests_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.account_requests_request_id_seq OWNED BY public.account_requests.request_id;


--
-- Name: admins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admins (
    username character varying(10) NOT NULL,
    password character varying(100) NOT NULL
);


--
-- Name: article; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.article (
    article_id integer NOT NULL,
    content text,
    image text,
    post_date timestamp without time zone NOT NULL,
    travel_trip_id integer,
    member_id integer NOT NULL,
    category_id character varying(10)
);


--
-- Name: article_article_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.article_article_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: article_article_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.article_article_id_seq OWNED BY public.article.article_id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    category_id character varying(10) NOT NULL,
    category_name character varying(255) NOT NULL
);


--
-- Name: districts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.districts (
    district_id integer NOT NULL,
    district_name character varying(100) NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL
);


--
-- Name: emergency_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.emergency_services (
    license_id character varying(100) NOT NULL,
    address character varying(255) NOT NULL,
    contact_information character varying(255),
    google_maps_link text NOT NULL,
    password character varying(255),
    tel_information character varying(255),
    username character varying(255),
    wellness_hub_description character varying(255),
    wellness_hub_img text,
    wellness_hub_latitude double precision,
    wellness_hub_longitude double precision,
    wellness_hub_name character varying(255) NOT NULL,
    category_id character varying(10),
    district_id integer,
    status character varying(255) DEFAULT 'active'::character varying,
    certificate_type text,
    operating_hours text,
    wellness_hub_gallery text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: favorite_wellness_hub; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favorite_wellness_hub (
    member_id integer NOT NULL,
    license_id character varying(100) NOT NULL
);


--
-- Name: main_route_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.main_route_categories (
    route_id integer NOT NULL,
    category_id character varying(10) NOT NULL
);


--
-- Name: main_route_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.main_route_details (
    id integer NOT NULL,
    order_number integer NOT NULL,
    district_id integer,
    route_id integer
);


--
-- Name: main_route_details_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.main_route_details_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: main_route_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.main_route_details_id_seq OWNED BY public.main_route_details.id;


--
-- Name: main_routes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.main_routes (
    route_id integer NOT NULL,
    route_description character varying(255) NOT NULL,
    route_name character varying(50) NOT NULL,
    created_by character varying(100),
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    pin_count integer,
    route_image text
);


--
-- Name: main_routes_route_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.main_routes_route_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: main_routes_route_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.main_routes_route_id_seq OWNED BY public.main_routes.route_id;


--
-- Name: member; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.member (
    member_id integer NOT NULL,
    email character varying(255) NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    password character varying(30) NOT NULL,
    profile_image character varying(255)
);


--
-- Name: member_member_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.member_member_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: member_member_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.member_member_id_seq OWNED BY public.member.member_id;


--
-- Name: my_travel_trip; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.my_travel_trip (
    travel_trip_id integer NOT NULL,
    description character varying(255),
    trip_name character varying(100) NOT NULL,
    article_id integer,
    member_id integer NOT NULL,
    origin_district_id integer,
    destination_district_id integer,
    duplicated_from_trip_id integer,
    original_member_id integer
);


--
-- Name: my_travel_trip_detail; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.my_travel_trip_detail (
    travel_trip_id integer NOT NULL,
    license_id character varying(255) NOT NULL,
    travel_trip_index integer NOT NULL
);


--
-- Name: my_travel_trip_travel_trip_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.my_travel_trip_travel_trip_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: my_travel_trip_travel_trip_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.my_travel_trip_travel_trip_id_seq OWNED BY public.my_travel_trip.travel_trip_id;


--
-- Name: notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification (
    notification_id integer NOT NULL,
    message_body character varying(255) NOT NULL,
    notification_status character varying(50) NOT NULL,
    notifydate timestamp without time zone NOT NULL,
    request_id integer
);


--
-- Name: notification_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notification_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notification_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notification_notification_id_seq OWNED BY public.notification.notification_id;


--
-- Name: official_articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.official_articles (
    article_id integer NOT NULL,
    article_category character varying(100) NOT NULL,
    article_detail text NOT NULL,
    article_title character varying(100) NOT NULL,
    author character varying(100) NOT NULL,
    img text NOT NULL,
    publish_date timestamp without time zone NOT NULL,
    article_images text,
    attachment_files text
);


--
-- Name: official_articles_article_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.official_articles_article_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: official_articles_article_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.official_articles_article_id_seq OWNED BY public.official_articles.article_id;


--
-- Name: operating_hours; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.operating_hours (
    oph_id integer NOT NULL,
    close_time time without time zone NOT NULL,
    day_of_week character varying(50) NOT NULL,
    open_time time without time zone NOT NULL,
    request_id integer,
    license_id character varying(100)
);


--
-- Name: operating_hours_oph_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.operating_hours_oph_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: operating_hours_oph_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.operating_hours_oph_id_seq OWNED BY public.operating_hours.oph_id;


--
-- Name: wellness_hubs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wellness_hubs (
    license_id character varying(100) NOT NULL,
    address character varying(255) NOT NULL,
    contact_information character varying(255),
    google_maps_link text NOT NULL,
    password character varying(100),
    tel_information character varying(10),
    username character varying(100),
    wellness_hub_description character varying(255),
    wellness_hub_img text,
    wellness_hub_latitude double precision,
    wellness_hub_longitude double precision,
    wellness_hub_name character varying(255) NOT NULL,
    category_id character varying(10),
    district_id integer,
    status character varying(20) DEFAULT 'active'::character varying,
    certificate_type text,
    operating_hours text,
    wellness_hub_gallery text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: account_requests request_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_requests ALTER COLUMN request_id SET DEFAULT nextval('public.account_requests_request_id_seq'::regclass);


--
-- Name: article article_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article ALTER COLUMN article_id SET DEFAULT nextval('public.article_article_id_seq'::regclass);


--
-- Name: main_route_details id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.main_route_details ALTER COLUMN id SET DEFAULT nextval('public.main_route_details_id_seq'::regclass);


--
-- Name: main_routes route_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.main_routes ALTER COLUMN route_id SET DEFAULT nextval('public.main_routes_route_id_seq'::regclass);


--
-- Name: member member_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member ALTER COLUMN member_id SET DEFAULT nextval('public.member_member_id_seq'::regclass);


--
-- Name: my_travel_trip travel_trip_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.my_travel_trip ALTER COLUMN travel_trip_id SET DEFAULT nextval('public.my_travel_trip_travel_trip_id_seq'::regclass);


--
-- Name: notification notification_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification ALTER COLUMN notification_id SET DEFAULT nextval('public.notification_notification_id_seq'::regclass);


--
-- Name: official_articles article_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.official_articles ALTER COLUMN article_id SET DEFAULT nextval('public.official_articles_article_id_seq'::regclass);


--
-- Name: operating_hours oph_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operating_hours ALTER COLUMN oph_id SET DEFAULT nextval('public.operating_hours_oph_id_seq'::regclass);


--
-- Data for Name: account_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.account_requests (request_id, requester_name, user_email, contact_information, tell_information, username, password, license_id, wellness_hub_name, address, google_maps_link, wellness_hub_description, wellness_hub_img, wellness_hub_gallery, wellness_hub_latitude, wellness_hub_longitude, certificate_type, operating_hours, verification_documents, request_status, rejection_reason, processed_date, category_id, district_id) FROM stdin;
1	กานต์พิชชา ใจดี	pimmada0803@gmail.com	@testinformation	0000000000	Orangeppx	12345678	1111111111	ทดสอบ1	dpedoepaemcl;msl;c53211515613c5d\nc,psm;///	https://maps.app.goo.gl/Kyz61Ekp2PP4GDo6A	ทททททททททททททท	https://csljpnypebwjgvoygqov.supabase.co/storage/v1/object/public/WELLNESS-IMAGES/wellness_hubs/d57be051-2bdf-4f83-9035-10625ec66812.jpg	["https://csljpnypebwjgvoygqov.supabase.co/storage/v1/object/public/WELLNESS-IMAGES/wellness_hubs/96c7b2ec-3954-4908-b3d5-1277be4466c3.jpg","https://csljpnypebwjgvoygqov.supabase.co/storage/v1/object/public/WELLNESS-IMAGES/wellness_hubs/d6a11248-3c43-4f52-beef-110da73ce0ed.jpg","https://csljpnypebwjgvoygqov.supabase.co/storage/v1/object/public/WELLNESS-IMAGES/wellness_hubs/0c7de41a-5934-4b5c-ac0c-ab55522297bc.jpg"]	18.8964483	99.0070299	55555, 66666	{"monday":{"active":true,"open":"09:00","close":"18:00"},"tuesday":{"active":true,"open":"09:00","close":"18:00"},"wednesday":{"active":true,"open":"09:00","close":"18:00"},"thursday":{"active":true,"open":"09:00","close":"18:00"},"friday":{"active":true,"open":"09:00","close":"18:00"},"saturday":{"active":true,"open":"09:00","close":"18:00"},"sunday":{"active":false,"open":"","close":""}}	[{"type":"ใบอนุญาตประกอบกิจการ / ใบอนุญาตสปาเพื่อสุขภาพ","name":"ใบอนุญาตประกอบกิจการ / ใบอนุญาตสปาเพื่อสุขภาพ_1.pdf","data":"https://csljpnypebwjgvoygqov.supabase.co/storage/v1/object/public/WELLNESS-IMAGES/documents/60509940-51ee-4ed9-b840-212c4e6f8c43.pdf"}]	APPROVED	\N	2026-10-27 13:28:54.089963	C01	1
\.


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admins (username, password) FROM stdin;
admin01	pw123456
admin02	pimmada8
\.


--
-- Data for Name: article; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.article (article_id, content, image, post_date, travel_trip_id, member_id, category_id) FROM stdin;
7	วันนี้ไปเที่ยวมาค่ะ ชอบลานตนาสปา ที่สุดเลยค่ะ เขาบริการดีม้ากกกก นวดสบายสุดๆ เผลอหลับเลยค่ะ😂	["/uploads/articles/e3871018-0352-4398-b443-886d46657c68.png","/uploads/articles/382063ee-2a0a-450c-bf56-54f9f8cba234.png","/uploads/articles/2dc27c5c-6e6c-4011-9e31-8f0bdb29fb44.png","/uploads/articles/0ddacb96-4034-45e6-9aa3-79be290827af.png","/uploads/articles/25e19e02-2f8e-4967-85e6-60fe889aa1ee.png","/uploads/articles/a47d6f0f-65f5-454e-a660-ae4213d3604c.png"]	2026-09-04 10:59:21.069	8	1	\N
8	วันนี้ไปเที่ยวมาค่ะ ชอบลานตนาสปา ที่สุดเลยค่ะ เขาบริการดีม้ากกกก เผลอหลับเลยด้วย	["/uploads/articles/34f26cc3-10b0-420f-83aa-c6287cdac5f6.png","/uploads/articles/4efbfc67-062d-404e-891c-e4524907edb3.png","/uploads/articles/803a63e5-c0c6-4069-9613-ea3aaecdd608.png","/uploads/articles/dc866aa2-3754-4184-b45e-0733603a2745.png"]	2026-09-04 11:24:38.458	8	1	\N
9	วันนี้ไปเที่ยวมาค่ะ	\N	2026-09-05 02:06:20.8	11	1	\N
10	fun	\N	2026-09-09 12:12:13.934	10	1	\N
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (category_id, category_name) FROM stdin;
C01	Wellness Spa & Massage
C02	Wellness Clinic
C03	Wellness Restaurant
C04	Wellness Accommodation
C05	Wellness Tourism
EM01	BLS (Basic Life Support)
EM02	ALS (Advanced Hospital)
\.


--
-- Data for Name: districts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.districts (district_id, district_name, latitude, longitude) FROM stdin;
1	เมืองเชียงใหม่	18.7915	98.986
2	จอมทอง	18.4182	98.6785
3	แม่แจ่ม	18.4988	98.3631
4	เชียงดาว	19.3661	98.9645
5	ดอยสะเก็ด	18.871	99.1375
6	แม่แตง	19.1215	98.946
7	แม่ริม	18.9142	98.9417
8	สะเมิง	18.8525	98.732
9	ฝาง	19.9145	99.2135
10	แม่อาย	20.031	99.2885
11	พร้าว	19.3645	99.2025
12	สันป่าตอง	18.6305	98.895
13	สันกำแพง	18.7451	99.1171
14	สันทราย	18.8912	99.0305
15	หางดง	18.6862	98.9176
16	ฮอด	18.1905	98.611
17	ดอยเต่า	17.9535	98.6855
18	อมก๋อย	17.801	98.3585
19	สารภี	18.7125	99.0355
20	เวียงแหง	19.559	98.6405
21	ไชยปราการ	19.7385	99.1415
22	แม่วาง	18.6285	98.6755
23	แม่ออน	18.7815	99.2485
24	ดอยหล่อ	18.4685	98.7885
25	กัลยาณิวัฒนา	19.0655	98.3055
\.


--
-- Data for Name: emergency_services; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.emergency_services (license_id, address, contact_information, google_maps_link, password, tel_information, username, wellness_hub_description, wellness_hub_img, wellness_hub_latitude, wellness_hub_longitude, wellness_hub_name, category_id, district_id, status, certificate_type, operating_hours, wellness_hub_gallery, created_at, updated_at) FROM stdin;
371	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B8%AA%E0%B8%A1%E0%B8%B2%E0%B8%84%E0%B8%A1%E0%B8%81%E0%B8%B9%E0%B9%89%E0%B8%A0%E0%B8%B1%E0%B8%A2%E0%B8%A8%E0%B8%A3%E0%B8%B1%E0%B8%97%E0%B8%98%E0%B8%B2%E0%B8%A3%E0%B8%A7%E0%B8%A1%E0%B9%83%E0%B8%88/@18.5762683,98.85515,3727m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30dbcb93e0988c31:0x259e4b39fcccbba7!8m2!3d18.5762686!4d98.8654283!16s%2Fg%2F11kk7381fy?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	!c8vn*gY	\N	ES_371	\N	\N	18.5762686	98.8654283	สมาคมกู้ภัยศรัทธารวมใจ	EM01	12	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
222	ไม่ระบุ	\N	#	yI*60QoR	\N	ES_222	\N	\N	\N	\N	เทศบาลตำบลสันผีเสื้อ	EM01	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
395	ไม่ระบุ	\N	#	$&Vb0HeZ	\N	ES_395	\N	\N	\N	\N	องค์การบริหารส่วนตำบลยางเปียง	EM01	18	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
396	ไม่ระบุ	\N	#	Ot1_5Fl6	\N	ES_396	\N	\N	\N	\N	องค์การบริหารส่วนตำบลม่อนจอง	EM01	18	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
247	ไม่ระบุ	\N	#	R#@*6L8v	\N	ES_247	\N	\N	\N	\N	เทศบาลตำบลสันมหาพน	EM01	6	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
248	ไม่ระบุ	\N	#	@5EszdRJ	\N	ES_248	\N	\N	\N	\N	องค์การบริหารส่วนตำบลกื้ดช้าง	EM01	6	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
246	ไม่ระบุ	\N	#	rad_4bpT	\N	ES_246	\N	\N	\N	\N	เทศบาลตำบลสันป่ายาง	EM01	6	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
225	ไม่ระบุ	\N	#	*#sW56qY	\N	ES_225	\N	\N	\N	\N	กู้ชีพอินทนนท์	EM01	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
289	ไม่ระบุ	\N	#	wGqv5JM%	\N	ES_289	\N	\N	\N	\N	องค์การบริหารส่วนตำบลตำบลข่วงเปา	EM01	2	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
290	ไม่ระบุ	\N	#	!bJ4hYLx	\N	ES_290	\N	\N	\N	\N	เทศบาลตำบลสบเตี๊ยะ	EM01	2	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
345	ไม่ระบุ	\N	#	3mJSDv#f	\N	ES_345	\N	\N	\N	\N	เทศบาลตำบลหนองแหย่ง	EM01	14	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
347	ไม่ระบุ	\N	#	PW*UMy4d	\N	ES_347	\N	\N	\N	\N	เทศบาลตำบลสันนาเม็ง	EM01	14	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
403	ไม่ระบุ	\N	#	8$_#jXIb	\N	ES_403	\N	\N	\N	\N	เทศบาลตำบลท่าข้าม	EM01	16	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
406	ไม่ระบุ	\N	#	Av#ph_3w	\N	ES_406	\N	\N	\N	\N	ท่าอากาศยานเชียงใหม่	EM02	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
409	ไม่ระบุ	\N	#	&ApDe*y2	\N	ES_409	\N	\N	\N	\N	โรงพยาบาลแมคคอร์มิค	EM02	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
414	ไม่ระบุ	\N	#	9G*nCAMK	\N	ES_414	\N	\N	\N	\N	โรงพยาบาลเวียงแหง	EM02	20	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
417	ไม่ระบุ	\N	#	et8&$2aA	\N	ES_417	\N	\N	\N	\N	โรงพยาบาลแม่อาย	EM02	10	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
418	ไม่ระบุ	\N	#	_0qzSi@b	\N	ES_418	\N	\N	\N	\N	โรงพยาบาลวัดจันทร์ฯ	EM02	25	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
388	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B8%A8%E0%B8%B9%E0%B8%99%E0%B8%A2%E0%B9%8C%E0%B8%81%E0%B8%B9%E0%B9%89%E0%B8%8A%E0%B8%B5%E0%B8%9E%E0%B8%81%E0%B8%B9%E0%B9%89%E0%B8%A0%E0%B8%B1%E0%B8%A2+%E0%B8%A8%E0%B8%A3%E0%B8%B5%E0%B9%80%E0%B8%A1%E0%B8%B7%E0%B8%AD%E0%B8%87%E0%B8%9B%E0%B8%87+%E0%B8%A7%E0%B8%B1%E0%B8%94%E0%B8%AD%E0%B8%A3%E0%B8%B1%E0%B8%8D%E0%B8%8D%E0%B8%A7%E0%B8%B2%E0%B8%AA+%E0%B8%9E%E0%B8%A5%E0%B8%B1%E0%B8%87%E0%B8%9A%E0%B8%A7%E0%B8%A3/@18.7503759,98.8747258,3723m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30da37cb71d3c98f:0xb9646ceaa38742a4!8m2!3d18.7503762!4d98.8850041!16s%2Fg%2F11h18kyvz6?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	Zue#8Tr_	\N	ES_388	\N	\N	18.7503762	98.8850041	กู้ภัยศรีเมืองปง	EM01	15	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
425	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B9%82%E0%B8%A3%E0%B8%87%E0%B8%9E%E0%B8%A2%E0%B8%B2%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B8%AA%E0%B8%B2%E0%B8%A3%E0%B8%A0%E0%B8%B5/@18.6807813,99.0328234,3725m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30da2dd91220ffd1:0xc7c36f8c7b4888cb!8m2!3d18.6807816!4d99.0431017!16s%2Fg%2F1v4028vs?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	oiXL1Q$K	\N	ES_425	\N	\N	18.6807816	99.0431017	โรงพยาบาลสารภี	EM02	19	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
426	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B9%82%E0%B8%A3%E0%B8%87%E0%B8%9E%E0%B8%A2%E0%B8%B2%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B8%AB%E0%B8%B2%E0%B8%87%E0%B8%94%E0%B8%87/@18.6830878,98.9080886,3725m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30da34041ae5815f:0xbd7efd102e9f9bcf!8m2!3d18.6830881!4d98.9183669!16s%2Fg%2F1tdrnwm1?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	0VCqWo$K	\N	ES_426	\N	\N	18.6830881	98.9183669	โรงพยาบาลหางดง	EM02	15	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
421	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B9%82%E0%B8%A3%E0%B8%87%E0%B8%9E%E0%B8%A2%E0%B8%B2%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B8%94%E0%B8%AD%E0%B8%A2%E0%B8%AA%E0%B8%B0%E0%B9%80%E0%B8%81%E0%B9%87%E0%B8%94/@18.8691088,99.1181247,3721m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30da2134a5a022e5:0xa604894f006d493f!8m2!3d18.8691091!4d99.128403!16s%2Fg%2F1t_6jzbx?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	OHu$*3xh	\N	ES_421	\N	\N	18.8691091	99.128403	โรงพยาบาลดอยสะเก็ด	EM02	5	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
271	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B8%AA%E0%B8%99%E0%B8%B2%E0%B8%A1%E0%B8%81%E0%B8%B5%E0%B8%AC%E0%B8%B2%E0%B8%95%E0%B8%B3%E0%B8%9A%E0%B8%A5%E0%B8%AD%E0%B8%AD%E0%B8%99%E0%B8%81%E0%B8%A5%E0%B8%B2%E0%B8%87/@18.7487386,99.2320614,3723m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30d98636e2f8ef61:0x5ccf7aedf5f166ff!8m2!3d18.7487389!4d99.2423397!16s%2Fg%2F1hc2kv7_m?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	F#1k0Zi8	\N	ES_271	\N	\N	18.7487389	99.2423397	องค์การบริหารส่วนตำบลออนกลาง	EM01	23	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
404	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B9%82%E0%B8%A3%E0%B8%87%E0%B8%9E%E0%B8%A2%E0%B8%B2%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B9%81%E0%B8%A1%E0%B9%88%E0%B8%A7%E0%B8%B2%E0%B8%87/@18.6160498,98.7642815,3726m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30da4b3995dacf99:0x54a2b59005cc6627!8m2!3d18.6160501!4d98.7745598!16s%2Fg%2F1tfr7mhq?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	7P0i%n9A	\N	ES_404	\N	\N	18.6160501	98.7745598	โรงพยาบาลแม่วาง	EM02	22	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
415	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B9%82%E0%B8%A3%E0%B8%87%E0%B8%9E%E0%B8%A2%E0%B8%B2%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B8%94%E0%B8%B2%E0%B8%A3%E0%B8%B2%E0%B8%A3%E0%B8%B1%E0%B8%A8%E0%B8%A1%E0%B8%B5/@18.9107236,98.9347536,3720m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30da3effffffffff:0xb23e2d549f18810a!8m2!3d18.9107239!4d98.9450319!16s%2Fg%2F11b6phkk4m?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	nx9KB$cZ	\N	ES_415	\N	\N	18.9107239	98.9450319	โรงพยาบาลดารารัศมี	EM02	7	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
228	ไม่ระบุ	\N	#	0JdGMU!b	\N	ES_228	\N	\N	\N	\N	เทศบาลตำบลแม่เหียะ	EM01	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
231	ไม่ระบุ	\N	#	KdsL1O%_	\N	ES_231	\N	\N	\N	\N	องค์การบริหารส่วนจังหวัดเชียงใหม่	EM01	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
267	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B8%AD%E0%B8%87%E0%B8%84%E0%B9%8C%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%9A%E0%B8%A3%E0%B8%B4%E0%B8%AB%E0%B8%B2%E0%B8%A3%E0%B8%AA%E0%B9%88%E0%B8%A7%E0%B8%99%E0%B8%95%E0%B8%B3%E0%B8%9A%E0%B8%A5%E0%B8%9A%E0%B9%89%E0%B8%B2%E0%B8%99%E0%B8%AA%E0%B8%AB%E0%B8%81%E0%B8%A3%E0%B8%93%E0%B9%8C/@18.7979707,99.2343087,3722m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30d988f1f790071f:0xa141d345b7e2b14a!8m2!3d18.797971!4d99.244587!16s%2Fg%2F1hm51xplx?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	EN*Do3i4	\N	ES_267	\N	\N	18.797971	99.244587	องค์การบริหารส่วนตำบลบ้านสหกรณ์	EM01	23	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
268	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B8%AD%E0%B8%87%E0%B8%84%E0%B9%8C%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%9A%E0%B8%A3%E0%B8%B4%E0%B8%AB%E0%B8%B2%E0%B8%A3%E0%B8%AA%E0%B9%88%E0%B8%A7%E0%B8%99%E0%B8%95%E0%B8%B3%E0%B8%9A%E0%B8%A5%E0%B8%AD%E0%B8%AD%E0%B8%99%E0%B9%80%E0%B8%AB%E0%B8%99%E0%B8%B7%E0%B8%AD/@18.7889927,99.2423737,3723m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30d98894f147eeab:0xee73b9171daab268!8m2!3d18.788993!4d99.252652!16s%2Fg%2F1hm5y1v0y?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	T0_vp8r5	\N	ES_268	\N	\N	18.788993	99.252652	องค์การบริหารส่วนตำบลออนเหนือ	EM01	23	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
408	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B9%82%E0%B8%A3%E0%B8%87%E0%B8%9E%E0%B8%A2%E0%B8%B2%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B9%80%E0%B8%97%E0%B8%A8%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B8%99%E0%B8%84%E0%B8%A3%E0%B9%80%E0%B8%8A%E0%B8%B5%E0%B8%A2%E0%B8%87%E0%B9%83%E0%B8%AB%E0%B8%A1%E0%B9%88/@18.7886459,98.9914778,3723m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30da3aa587155555:0x8bc138c66caa06ef!8m2!3d18.7886462!4d99.0017561!16s%2Fg%2F11sscs0dlq?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	3%$yFrVC	\N	ES_408	\N	\N	18.7886462	99.0017561	โรงพยาบาลเทศบาลนครเชียงใหม่	EM02	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
405	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B9%82%E0%B8%A3%E0%B8%87%E0%B8%9E%E0%B8%A2%E0%B8%B2%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B9%80%E0%B8%8A%E0%B8%B5%E0%B8%A2%E0%B8%87%E0%B8%94%E0%B8%B2%E0%B8%A7/@19.4029357,98.964921,3709m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30d0a65123b1ab0f:0x4eda3ac924eaaf61!8m2!3d19.402936!4d98.9751993!16s%2Fg%2F1th84kd4?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	Gnb2#8jW	\N	ES_405	\N	\N	19.402936	98.9751993	โรงพยาบาลเชียงดาว	EM02	4	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
259	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B8%AA%E0%B8%B3%E0%B8%99%E0%B8%B1%E0%B8%81%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B9%80%E0%B8%97%E0%B8%A8%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B8%95%E0%B8%B3%E0%B8%9A%E0%B8%A5%E0%B8%A3%E0%B8%B4%E0%B8%A1%E0%B9%80%E0%B8%AB%E0%B8%99%E0%B8%B7%E0%B8%AD/@18.9333502,98.9302477,3719m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30da3dcf2c5034d9:0xf555bbf7c947d2b1!8m2!3d18.9333505!4d98.940526!16s%2Fg%2F1pzr2w6w5?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	nUtw!54D	\N	ES_259	\N	\N	18.9333505	98.940526	เทศบาลตำบลริมเหนือ	EM01	7	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
230	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B8%A8%E0%B8%B9%E0%B8%99%E0%B8%A2%E0%B9%8C%E0%B8%81%E0%B8%B9%E0%B9%89%E0%B8%A0%E0%B8%B1%E0%B8%A2%E0%B8%95%E0%B8%B3%E0%B8%A3%E0%B8%A7%E0%B8%88%E0%B8%97%E0%B8%B2%E0%B8%87%E0%B8%AB%E0%B8%A5%E0%B8%A7%E0%B8%87+%E0%B8%88%E0%B8%B1%E0%B8%87%E0%B8%AB%E0%B8%A7%E0%B8%B1%E0%B8%94%E0%B9%80%E0%B8%8A%E0%B8%B5%E0%B8%A2%E0%B8%87%E0%B9%83%E0%B8%AB%E0%B8%A1%E0%B9%88/@18.7638017,99.0203479,3723m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30da2f1d3f148535:0x63e0abe4bf4913d0!8m2!3d18.763802!4d99.0306262!16s%2Fg%2F11fkkyxsns?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	w8#5GgDZ	\N	ES_230	\N	\N	18.763802	99.0306262	กู้ภัยตำรวจทางหลวง	EM01	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
329	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B9%80%E0%B8%97%E0%B8%A8%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B8%95%E0%B8%B3%E0%B8%9A%E0%B8%A5%E0%B9%81%E0%B8%A1%E0%B9%88%E0%B8%9B%E0%B8%B1%E0%B9%8B%E0%B8%87/@19.2503546,99.1737874,3712m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30d9f8bfffc30335:0xeccc8b8b85815971!8m2!3d19.2503549!4d99.1840657!16s%2Fg%2F1pzq1vkc7?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	X#0meMT!	\N	ES_329	\N	\N	19.2503549	99.1840657	เทศบาลตำบลแม่ปั๋ง	EM01	11	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
207	ไม่ระบุ	\N	#	v0DwK7F$	\N	ES_207	\N	\N	\N	\N	องค์การบริหารส่วนตำบลแม่วิน	EM01	22	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
208	ไม่ระบุ	\N	#	b5c#k1K3	\N	ES_208	\N	\N	\N	\N	องค์การบริหารส่วนตำบลบ้านกาด	EM01	22	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
209	ไม่ระบุ	\N	#	B6$p#Gsc	\N	ES_209	\N	\N	\N	\N	เทศบาลตำบลแม่วาง	EM01	22	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
210	ไม่ระบุ	\N	#	b#6jQpUK	\N	ES_210	\N	\N	\N	\N	องค์การบริหารส่วนตำบลทุ่งรวงทอง	EM01	22	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
211	ไม่ระบุ	\N	#	Ux50q&LX	\N	ES_211	\N	\N	\N	\N	องค์การบริหารส่วนตำบลเชียงดาว	EM01	4	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
212	ไม่ระบุ	\N	#	z5RA#ru7	\N	ES_212	\N	\N	\N	\N	เทศบาลตำบลเมืองนะ	EM01	4	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
213	ไม่ระบุ	\N	#	nA%q&3$1	\N	ES_213	\N	\N	\N	\N	เทศบาลตำบลปิงโค้ง	EM01	4	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
214	ไม่ระบุ	\N	#	Uf1XoA4*	\N	ES_214	\N	\N	\N	\N	เทศบาลตำบลเชียงดาว	EM01	4	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
215	ไม่ระบุ	\N	#	r3#@iG*R	\N	ES_215	\N	\N	\N	\N	เทศบาลตำบลเมืองงาย	EM01	4	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
216	ไม่ระบุ	\N	#	i2&%K09I	\N	ES_216	\N	\N	\N	\N	เทศบาลตำบลทุ่งข้าวพวง	EM01	4	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
217	ไม่ระบุ	\N	#	hBPy!aJ4	\N	ES_217	\N	\N	\N	\N	องค์การบริหารส่วนตำบลเมืองคอง	EM01	4	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
218	ไม่ระบุ	\N	#	XJwZy@82	\N	ES_218	\N	\N	\N	\N	เทศบาลตำบลแม่นะ	EM01	4	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
219	ไม่ระบุ	\N	#	EWtqk7@l	\N	ES_219	\N	\N	\N	\N	เทศบาลตำบลป่าแดด	EM01	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
220	ไม่ระบุ	\N	#	LN4c&mhb	\N	ES_220	\N	\N	\N	\N	องค์การบริหารส่วนตำบลห้วยแก้ว	EM01	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
221	ไม่ระบุ	\N	#	foUF%I6u	\N	ES_221	\N	\N	\N	\N	เทศบาลตำบลหนองป่าครั่ง	EM01	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
270	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B8%AD%E0%B8%87%E0%B8%84%E0%B9%8C%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%9A%E0%B8%A3%E0%B8%B4%E0%B8%AB%E0%B8%B2%E0%B8%A3%E0%B8%AA%E0%B9%88%E0%B8%A7%E0%B8%99%E0%B8%95%E0%B8%B3%E0%B8%9A%E0%B8%A5%E0%B8%97%E0%B8%B2%E0%B9%80%E0%B8%AB%E0%B8%99%E0%B8%B7%E0%B8%AD/@18.6646486,99.2821249,3725m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30d983f0dff45d9f:0x4993a4ea28ecfef4!8m2!3d18.6646489!4d99.2924032!16s%2Fg%2F11g8csy074?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	50FypZW%	\N	ES_270	\N	\N	18.6646489	99.2924032	องค์การบริหารส่วนตำบลทาเหนือ	EM01	23	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
235	ไม่ระบุ	\N	#	s_VQ1Gp7	\N	ES_235	\N	\N	\N	\N	เทศบาลฟ้าฮ่าม	EM01	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
236	ไม่ระบุ	\N	#	DK0%Y*Lb	\N	ES_236	\N	\N	\N	\N	องค์การบริหารส่วนตำบลเปียงหลวง	EM01	20	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
238	ไม่ระบุ	\N	#	J@c0Rzm*	\N	ES_238	\N	\N	\N	\N	เทศบาลตำบลท่าผา	EM01	3	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
239	ไม่ระบุ	\N	#	0lEgZW&b	\N	ES_239	\N	\N	\N	\N	เทศบาลตำบลแม่แจ่ม	EM01	3	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
240	ไม่ระบุ	\N	#	&A0hqzO8	\N	ES_240	\N	\N	\N	\N	องค์การบริหารส่วนตำบลช่างเคิ่ง	EM01	3	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
241	ไม่ระบุ	\N	#	NX1G%a$8	\N	ES_241	\N	\N	\N	\N	องค์การบริหารส่วนตำบลกองแขก	EM01	3	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
242	ไม่ระบุ	\N	#	7kPrS$lC	\N	ES_242	\N	\N	\N	\N	องค์การบริหารส่วนตำบลปางหินฝน	EM01	3	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
243	ไม่ระบุ	\N	#	iEDGZ#6X	\N	ES_243	\N	\N	\N	\N	องค์การบริหารส่วนตำบลบ้านทับ	EM01	3	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
244	ไม่ระบุ	\N	#	xW#voEj1	\N	ES_244	\N	\N	\N	\N	องค์การบริหารส่วนตำบลแม่นาจร	EM01	3	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
245	ไม่ระบุ	\N	#	YD1#8rlZ	\N	ES_245	\N	\N	\N	\N	องค์การบริหารส่วนตำบลสบเปิง	EM01	6	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
249	ไม่ระบุ	\N	#	uf@c#1HM	\N	ES_249	\N	\N	\N	\N	เทศบาลตำบลแม่หอพระ	EM01	6	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
251	ไม่ระบุ	\N	#	%o523XBf	\N	ES_251	\N	\N	\N	\N	องค์การบริหารส่วนตำบลบ้านช้าง	EM01	6	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
252	ไม่ระบุ	\N	#	FXoV4t5&	\N	ES_252	\N	\N	\N	\N	องค์การบริหารส่วนตำบลบ้านเป้า	EM01	6	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
253	ไม่ระบุ	\N	#	H8KReUw#	\N	ES_253	\N	\N	\N	\N	เทศบาลตำบลแม่แตง	EM01	6	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
254	ไม่ระบุ	\N	#	q9&gJ_o$	\N	ES_254	\N	\N	\N	\N	เทศบาลตำบลอินทขิล	EM01	6	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
255	ไม่ระบุ	\N	#	!lxK@6Da	\N	ES_255	\N	\N	\N	\N	เทศบาลตำบลเมืองแกนพัฒนา	EM01	6	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
256	ไม่ระบุ	\N	#	@IP0wi3W	\N	ES_256	\N	\N	\N	\N	เทศบาลตำบลจอมแจ้ง	EM01	6	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
257	ไม่ระบุ	\N	#	6Ltp0*lS	\N	ES_257	\N	\N	\N	\N	องค์การบริหารส่วนตำบลแม่สา	EM01	7	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
258	ไม่ระบุ	\N	#	#Nw8zR57	\N	ES_258	\N	\N	\N	\N	องค์การบริหารส่วนตำบลดอนแก้ว	EM01	7	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
260	ไม่ระบุ	\N	#	FuRXs&1!	\N	ES_260	\N	\N	\N	\N	เทศบาลตำบลขี้เหล็ก	EM01	7	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
262	ไม่ระบุ	\N	#	2O%4hLKN	\N	ES_262	\N	\N	\N	\N	เทศบาลตำบลแม่แรม	EM01	7	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
263	ไม่ระบุ	\N	#	6EP@UyO_	\N	ES_263	\N	\N	\N	\N	องค์การบริหารส่วนตำบลโป่งแยง	EM01	7	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
264	ไม่ระบุ	\N	#	YU2%KI#t	\N	ES_264	\N	\N	\N	\N	เทศบาลตำบลเหมืองแก้ว	EM01	7	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
265	ไม่ระบุ	\N	#	92Josg@k	\N	ES_265	\N	\N	\N	\N	เทศบาลตำบลแม่ริม	EM01	7	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
266	ไม่ระบุ	\N	#	u9jQdn&5	\N	ES_266	\N	\N	\N	\N	โรงเรียนนานาชาติเปรมติณสูลานนท์	EM01	7	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
272	ไม่ระบุ	\N	#	&DeUG2E@	\N	ES_272	\N	\N	\N	\N	เทศบาลตำบลแม่อาย	EM01	10	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
273	ไม่ระบุ	\N	#	IJzb5@w%	\N	ES_273	\N	\N	\N	\N	องค์การบริหารส่วนตำบลดอยลาง	EM01	10	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
275	ไม่ระบุ	\N	#	j2TVp_ad	\N	ES_275	\N	\N	\N	\N	องค์การบริหารส่วนตำบลแม่สาว	EM01	10	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
276	ไม่ระบุ	\N	#	$cfb4pVy	\N	ES_276	\N	\N	\N	\N	องค์การบริหารส่วนตำบลแม่นาวาง	EM01	10	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
277	ไม่ระบุ	\N	#	#IpBT25b	\N	ES_277	\N	\N	\N	\N	องค์การบริหารส่วนตำบลสันต้นหมื้อ	EM01	10	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
279	ไม่ระบุ	\N	#	%@l6WGoM	\N	ES_279	\N	\N	\N	\N	องค์การบริหารส่วนตำบลบ้านหลวง	EM01	10	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
280	ไม่ระบุ	\N	#	b#!D1PGN	\N	ES_280	\N	\N	\N	\N	เทศบาลตำบลไชยปราการ	EM01	21	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
282	ไม่ระบุ	\N	#	ogmLG&8U	\N	ES_282	\N	\N	\N	\N	เทศบาลตำบลหนองบัว	EM01	21	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
284	ไม่ระบุ	\N	#	s5A3np8$	\N	ES_284	\N	\N	\N	\N	องค์การบริหารส่วนตำบลแม่ทะลบ	EM01	21	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
285	ไม่ระบุ	\N	#	i1&E@Kp8	\N	ES_285	\N	\N	\N	\N	องค์การบริหารส่วนตำบลแม่แดด	EM01	25	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
286	ไม่ระบุ	\N	#	Z&3C!xhm	\N	ES_286	\N	\N	\N	\N	เทศบาลตำบลจอมทอง	EM01	2	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
224	ไม่ระบุ	\N	#	F_8Mn@X9	\N	ES_224	\N	\N	\N	\N	เทศบาลตำบลท่าศาลา	EM01	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
291	ไม่ระบุ	\N	#	8$c!uH6z	\N	ES_291	\N	\N	\N	\N	เทศบาลตำบลดอยแก้ว	EM01	2	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
292	ไม่ระบุ	\N	#	wvH$1_p3	\N	ES_292	\N	\N	\N	\N	เทศบาลตำบลบ้านหลวง	EM01	2	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
293	ไม่ระบุ	\N	#	1@CS0wTP	\N	ES_293	\N	\N	\N	\N	เทศบาลตำบลบ้านแปะ	EM01	2	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
295	ไม่ระบุ	\N	#	1u8&XbA%	\N	ES_295	\N	\N	\N	\N	องค์การบริหารส่วนตำบลดอยเต่า	EM01	17	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
296	ไม่ระบุ	\N	#	yG3eZhO&	\N	ES_296	\N	\N	\N	\N	องค์การบริหารส่วนตำบลโป่งทุ่ง	EM01	17	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
297	ไม่ระบุ	\N	#	d2&*93JT	\N	ES_297	\N	\N	\N	\N	องค์การบริหารส่วนตำบลบงตัน	EM01	17	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
298	ไม่ระบุ	\N	#	!Nta4cx2	\N	ES_298	\N	\N	\N	\N	เทศบาลตำบลท่าเดื่อ-มืดกา	EM01	17	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
299	ไม่ระบุ	\N	#	_0#!%DhC	\N	ES_299	\N	\N	\N	\N	องค์การบริหารส่วนตำบลสันปูเลย	EM01	5	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
300	ไม่ระบุ	\N	#	CQp1e&9L	\N	ES_300	\N	\N	\N	\N	เทศบาลตำบลแม่ฮ้อยเงิน	EM01	5	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
302	ไม่ระบุ	\N	#	0cvEtf%L	\N	ES_302	\N	\N	\N	\N	เทศบาลตำบลป่าเมี่ยง	EM01	5	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
303	ไม่ระบุ	\N	#	D2*F!hsB	\N	ES_303	\N	\N	\N	\N	เทศบาลตำบลแม่โป่ง	EM01	5	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
304	ไม่ระบุ	\N	#	6I!9SVkU	\N	ES_304	\N	\N	\N	\N	เทศบาลตำบลตลาดใหญ่	EM01	5	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
305	ไม่ระบุ	\N	#	I!R9oqT%	\N	ES_305	\N	\N	\N	\N	เทศบาลตำบลป่าป้อง	EM01	5	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
306	ไม่ระบุ	\N	#	tQ_G6lCv	\N	ES_306	\N	\N	\N	\N	เทศบาลตำบลเชิงดอย	EM01	5	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
308	ไม่ระบุ	\N	#	Gtc*!1Uu	\N	ES_308	\N	\N	\N	\N	เทศบาลตำบลแม่คือ	EM01	5	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
309	ไม่ระบุ	\N	#	2U5_DePz	\N	ES_309	\N	\N	\N	\N	เทศบาลตำบลลวงเหนือ	EM01	5	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
311	ไม่ระบุ	\N	#	$BvEw2C3	\N	ES_311	\N	\N	\N	\N	เทศบาลตำบลดอยสะเก็ด	EM01	5	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
312	ไม่ระบุ	\N	#	RaB4_J0Y	\N	ES_312	\N	\N	\N	\N	สมาคมกู้ชีพกู้ภัยโพธิ์เงิน อำเภอดอยสะเก็ด	EM01	5	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
313	ไม่ระบุ	\N	#	nXWw#K28	\N	ES_313	\N	\N	\N	\N	เทศบาลตำบลสง่าบ้าน	EM01	5	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
314	ไม่ระบุ	\N	#	v05n7R#q	\N	ES_314	\N	\N	\N	\N	กู้ภัยอินทร์ทรา	EM01	5	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
315	ไม่ระบุ	\N	#	fpU6&*Od	\N	ES_315	\N	\N	\N	\N	องค์การบริหารส่วนตำบลดอยหล่อ	EM01	24	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
316	ไม่ระบุ	\N	#	txmLR8!Z	\N	ES_316	\N	\N	\N	\N	เทศบาลตำบลสองแคว	EM01	24	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
317	ไม่ระบุ	\N	#	Xu1t@kWb	\N	ES_317	\N	\N	\N	\N	เทศบาลตำบลยางคราม	EM01	24	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
318	ไม่ระบุ	\N	#	x9E$@wjp	\N	ES_318	\N	\N	\N	\N	เทศบาลตำบลสันติสุข	EM01	24	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
319	ไม่ระบุ	\N	#	Z7mELo5!	\N	ES_319	\N	\N	\N	\N	เทศบาลตำบลแม่ข่า	EM01	9	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
321	ไม่ระบุ	\N	#	VfSeC!1w	\N	ES_321	\N	\N	\N	\N	องค์การบริหารส่วนตำบลแม่สูน	EM01	9	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
322	ไม่ระบุ	\N	#	EFR50@ts	\N	ES_322	\N	\N	\N	\N	องค์การบริหารส่วนตำบลแม่งอน	EM01	9	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
323	ไม่ระบุ	\N	#	0Wm5&Psu	\N	ES_323	\N	\N	\N	\N	องค์การบริหารส่วนตำบลม่อนปิ่น	EM01	9	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
324	ไม่ระบุ	\N	#	_qQY0bRd	\N	ES_324	\N	\N	\N	\N	องค์การบริหารส่วนตำบลแม่คะ	EM01	9	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
325	ไม่ระบุ	\N	#	V0*mFOu&	\N	ES_325	\N	\N	\N	\N	องค์การบริหารส่วนตำบลเวียง	EM01	9	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
331	ไม่ระบุ	\N	#	CaE6&wT#	\N	ES_331	\N	\N	\N	\N	องค์การบริหารส่วนตำบลแม่แวน	EM01	11	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
333	ไม่ระบุ	\N	#	6d4BRc%!	\N	ES_333	\N	\N	\N	\N	องค์การบริหารส่วนตำบลโหล่งขอด	EM01	11	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
335	ไม่ระบุ	\N	#	Xa1@tgvY	\N	ES_335	\N	\N	\N	\N	เทศบาลตำบลแม่ปูคา	EM01	13	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
336	ไม่ระบุ	\N	#	C5kROM*L	\N	ES_336	\N	\N	\N	\N	เทศบาลตำบลสันกลาง	EM01	13	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
337	ไม่ระบุ	\N	#	aJiE_8OA	\N	ES_337	\N	\N	\N	\N	เทศบาลตำบลออนใต้	EM01	13	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
339	ไม่ระบุ	\N	#	P7cm%jZv	\N	ES_339	\N	\N	\N	\N	เทศบาลตำบลบวกค้าง	EM01	13	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
340	ไม่ระบุ	\N	#	0$olWM_B	\N	ES_340	\N	\N	\N	\N	องค์การบริหารส่วนตำบลห้วยทราย	EM01	13	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
341	ไม่ระบุ	\N	#	m@OaETh4	\N	ES_341	\N	\N	\N	\N	เทศบาลตำบลห้วยทราย	EM01	13	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
342	ไม่ระบุ	\N	#	7k&5VsYM	\N	ES_342	\N	\N	\N	\N	เทศบาลตำบลสันกำแพง	EM01	13	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
346	ไม่ระบุ	\N	#	EcYWZ!0T	\N	ES_346	\N	\N	\N	\N	เทศบาลตำบลเจดีย์แม่ครัว	EM01	14	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
348	ไม่ระบุ	\N	#	rw_6@2SL	\N	ES_348	\N	\N	\N	\N	โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านหนองไคร้	EM01	14	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
349	ไม่ระบุ	\N	#	SUdfB1#A	\N	ES_349	\N	\N	\N	\N	เทศบาลตำบลสันทรายหลวง	EM01	14	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
350	ไม่ระบุ	\N	#	TVx1&ZtW	\N	ES_350	\N	\N	\N	\N	เทศบาลเมืองแม่โจ้	EM01	14	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
351	ไม่ระบุ	\N	#	&syH%2zM	\N	ES_351	\N	\N	\N	\N	เทศบาลตำบลหนองหาร	EM01	14	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
353	ไม่ระบุ	\N	#	w!5pnrZG	\N	ES_353	\N	\N	\N	\N	เทศบาลตำบลสันป่าเปา	EM01	14	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
354	ไม่ระบุ	\N	#	aC$0uqKG	\N	ES_354	\N	\N	\N	\N	เทศบาลตำบลแม่แฝก	EM01	14	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
355	ไม่ระบุ	\N	#	W2vf!Lym	\N	ES_355	\N	\N	\N	\N	เทศบาลตำบลป่าไผ่	EM01	14	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
356	ไม่ระบุ	\N	#	%O9DtNiE	\N	ES_356	\N	\N	\N	\N	เทศบาลตำบลสันพระเนตร	EM01	14	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
357	ไม่ระบุ	\N	#	#@Ay7Rop	\N	ES_357	\N	\N	\N	\N	เทศบาลตำบลเมืองเล็น	EM01	14	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
358	ไม่ระบุ	\N	#	52!icEFt	\N	ES_358	\N	\N	\N	\N	เทศบาลตำบลสันป่าตอง	EM01	12	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
360	ไม่ระบุ	\N	#	Qh#E0bmr	\N	ES_360	\N	\N	\N	\N	เทศบาลตำบลยุหว่า	EM01	12	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
361	ไม่ระบุ	\N	#	Nq3IewW&	\N	ES_361	\N	\N	\N	\N	องค์การบริหารส่วนตำบลเวียงท่ากาน	EM01	12	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
362	ไม่ระบุ	\N	#	gT3fm!rL	\N	ES_362	\N	\N	\N	\N	องค์การบริหารส่วนตำบลแม่ก๊า	EM01	12	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
363	ไม่ระบุ	\N	#	9Iu!w*1A	\N	ES_363	\N	\N	\N	\N	องค์การบริหารส่วนตำบลมะขุนหวาน	EM01	12	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
364	ไม่ระบุ	\N	#	2Nx*aE8u	\N	ES_364	\N	\N	\N	\N	องค์การบริหารส่วนตำบลท่าวังพร้าว	EM01	12	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
365	ไม่ระบุ	\N	#	9*n5ZJFj	\N	ES_365	\N	\N	\N	\N	องค์การบริหารส่วนตำบลทุ่งสะโตก	EM01	12	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
366	ไม่ระบุ	\N	#	#_JA6gh5	\N	ES_366	\N	\N	\N	\N	เทศบาลตำบลทุ่งต้อม	EM01	12	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
367	ไม่ระบุ	\N	#	d0rwx3#Q	\N	ES_367	\N	\N	\N	\N	เทศบาลตำบลบ้านกลาง	EM01	12	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
369	ไม่ระบุ	\N	#	w8_bIrd3	\N	ES_369	\N	\N	\N	\N	องค์การบริหารส่วนตำบลมะขามหลวง	EM01	12	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
370	ไม่ระบุ	\N	#	h8oE7L_V	\N	ES_370	\N	\N	\N	\N	เทศบาลตำบลบ้านแม	EM01	12	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
372	ไม่ระบุ	\N	#	1nR6ItZ*	\N	ES_372	\N	\N	\N	\N	เทศบาลตำบลยางเนิ้ง	EM01	19	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
373	ไม่ระบุ	\N	#	A$dvsBr9	\N	ES_373	\N	\N	\N	\N	เทศบาลตำบลชมภู 	EM01	19	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
374	ไม่ระบุ	\N	#	%aO1sPKn	\N	ES_374	\N	\N	\N	\N	เทศบาลตำบลหนองแฝก	EM01	19	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
375	ไม่ระบุ	\N	#	wB0*uNHL	\N	ES_375	\N	\N	\N	\N	เทศบาลตำบลท่าวังตาล	EM01	19	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
376	ไม่ระบุ	\N	#	aZ*fB91P	\N	ES_376	\N	\N	\N	\N	เทศบาลตำบลสารภี	EM01	19	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
377	ไม่ระบุ	\N	#	O7@jlRrw	\N	ES_377	\N	\N	\N	\N	องค์การบริหารส่วนตำบลป่าบง	EM01	19	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
378	ไม่ระบุ	\N	#	c_KZ06LI	\N	ES_378	\N	\N	\N	\N	เทศบาลตำบลไชยสถาน	EM01	19	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
379	ไม่ระบุ	\N	#	LP&Q49yE	\N	ES_379	\N	\N	\N	\N	เทศบาลตำบลขัวมุง	EM01	19	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
381	ไม่ระบุ	\N	#	f&Ap#4QS	\N	ES_381	\N	\N	\N	\N	องค์การบริหารส่วนตำบลท่ากว้าง	EM01	19	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
382	ไม่ระบุ	\N	#	#rk8zXND	\N	ES_382	\N	\N	\N	\N	องค์การบริหารส่วนตำบลขุนคง	EM01	15	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
383	ไม่ระบุ	\N	#	*s9JWZc%	\N	ES_383	\N	\N	\N	\N	องค์การบริหารส่วนตำบลหนองแก๋ว	EM01	15	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
384	ไม่ระบุ	\N	#	#@JzX!27	\N	ES_384	\N	\N	\N	\N	เทศบาลตำบลหางดง	EM01	15	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
385	ไม่ระบุ	\N	#	0gR8D5Z$	\N	ES_385	\N	\N	\N	\N	เทศบาลตำบลน้ำแพร่	EM01	15	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
386	ไม่ระบุ	\N	#	$%6ZpiVI	\N	ES_386	\N	\N	\N	\N	องค์การบริหารส่วนตำบลสบแม่ข่า	EM01	15	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
387	ไม่ระบุ	\N	#	DUd$78cL	\N	ES_387	\N	\N	\N	\N	เทศบาลตำบลหนองตอง	EM01	15	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
390	ไม่ระบุ	\N	#	gs$&l6Xz	\N	ES_390	\N	\N	\N	\N	เทศบาลตำบลบ้านแหวน	EM01	15	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
391	ไม่ระบุ	\N	#	SlVHF3@%	\N	ES_391	\N	\N	\N	\N	เทศบาลตำบลน้ำแพร่พัฒนา	EM01	15	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
392	ไม่ระบุ	\N	#	_j%KsgV7	\N	ES_392	\N	\N	\N	\N	เทศบาลตำบลหารแก้ว	EM01	15	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
393	ไม่ระบุ	\N	#	KOd#f$6r	\N	ES_393	\N	\N	\N	\N	เทศบาลตำบลหนองควาย	EM01	15	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
394	ไม่ระบุ	\N	#	fE39uB@Q	\N	ES_394	\N	\N	\N	\N	เทศบาลตำบลแม่ท่าช้าง	EM01	15	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
397	ไม่ระบุ	\N	#	IY$yLh8T	\N	ES_397	\N	\N	\N	\N	เทศบาลตำบลอมก๋อย	EM01	18	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
399	ไม่ระบุ	\N	#	$vGj3f*5	\N	ES_399	\N	\N	\N	\N	องค์การบริหารส่วนตำบลนาเกียน	EM01	18	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
344	ไม่ระบุ	\N	#	@4Fp0QP!	\N	ES_344	\N	\N	\N	\N	องค์การบริหารส่วนตำบลสันกำแพง	EM01	13	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
419	ไม่ระบุ	\N	#	62P%Mb7S	\N	ES_419	\N	\N	\N	\N	โรงพยาบาลดอยเต่า	EM02	17	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
420	ไม่ระบุ	\N	#	Bw2sPq!I	\N	ES_420	\N	\N	\N	\N	องค์การบริหารส่วนตำบลบ้านแอ่น	EM02	17	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
424	ไม่ระบุ	\N	#	*M643Hpo	\N	ES_424	\N	\N	\N	\N	เทศบาลตำบลหนองผึ้ง	EM02	19	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
411	ไม่ระบุ	\N	google.com/maps/place/โรงพยาบาลเทพปัญญา/@18.7886459,98.9914778,3723m/data=!3m1!1e3!4m6!3m5!1s0x30da3acc97adf721:0xdb17a06a9ff81257!8m2!3d18.8102472!4d99.0113466!16s%2Fg%2F1w935nnb?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	K@v58sOB	\N	ES_411	\N	\N	\N	\N	โรงพยาบาลเทพปัญญา	EM02	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
416	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B9%82%E0%B8%A3%E0%B8%87%E0%B8%9E%E0%B8%A2%E0%B8%B2%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B9%81%E0%B8%A1%E0%B9%88%E0%B8%AD%E0%B8%AD%E0%B8%99/@18.7435763,99.2219965,931m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30d987b84b1295d1:0xbaf163b9d8e1e977!8m2!3d18.7435763!4d99.2219965!16s%2Fg%2F1td82jhd?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	45B&!@l*	\N	ES_416	\N	\N	18.7435763	99.2219965	โรงพยาบาลแม่ออน	EM02	23	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
413	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B9%82%E0%B8%A3%E0%B8%87%E0%B8%9E%E0%B8%A2%E0%B8%B2%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B8%81%E0%B8%AD%E0%B8%87%E0%B8%9A%E0%B8%B4%E0%B8%99+41/@18.7779904,98.9626084,3723m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30da307e57f489e3:0xd1eda7b439c9feb5!8m2!3d18.7779907!4d98.9728867!16s%2Fg%2F1hm1tcz92?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	u$1vnIGi	\N	ES_413	\N	\N	18.7779907	98.9728867	โรงพยาบาลกองบิน 41	EM02	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
423	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B9%82%E0%B8%A3%E0%B8%87%E0%B8%9E%E0%B8%A2%E0%B8%B2%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B8%9E%E0%B8%A3%E0%B9%89%E0%B8%B2%E0%B8%A7/@19.3674411,99.1898569,3710m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30d75530904af679:0x45d196fca20afa13!8m2!3d19.3674414!4d99.2001352!16s%2Fg%2F1wk0b779?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	vA98Gk*%	\N	ES_423	\N	\N	19.3674414	99.2001352	โรงพยาบาลพร้าว	EM02	11	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
412	ไม่ระบุ	\N	#	wel3M8@L	\N	ES_412	\N	\N	\N	\N	โรงพยาบาลทั่วไปขนาดใหญ่ลานนา	EM02	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
410	84/3 ถนนเชียงใหม่-ลำปาง ตำบลช้างเผือก อำเภอเมืองเชียงใหม่ เชียงใหม่ 50300	\N	https://maps.app.goo.gl/hVmBkmsTGtATue6g9	H9vS!1o6	\N	ES_410	\N	\N	18.8111031	98.9813544	โรงพยาบาลเชียงใหม่ฮอสพิทอล	EM02	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
226	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B8%A8%E0%B8%B9%E0%B8%99%E0%B8%A2%E0%B9%8C%E0%B8%9B%E0%B8%8F%E0%B8%B4%E0%B8%9A%E0%B8%B1%E0%B8%95%E0%B8%B4%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%AB%E0%B8%99%E0%B9%88%E0%B8%A7%E0%B8%A2%E0%B9%80%E0%B8%89%E0%B8%9E%E0%B8%B2%E0%B8%B0%E0%B8%81%E0%B8%B4%E0%B8%88+%E0%B8%81%E0%B8%B9%E0%B9%89%E0%B8%A0%E0%B8%B1%E0%B8%A2%E0%B8%AB%E0%B8%A2%E0%B8%B2%E0%B8%94%E0%B8%9F%E0%B9%89%E0%B8%B2/@18.7637835,98.9483965,29785m/data=!3m1!1e3!4m10!1m2!2m1!1z4LiB4Li54LmJ4LiK4Li14Lie4Lir4Lii4Liy4LiU4Lif4LmJ4Liy!3m6!1s0x30da25eb7dfa4e73:0x91c6e572e3c9dee1!8m2!3d18.8221526!4d99.015597!15sCifguIHguLnguYnguIrguLXguJ7guKvguKLguLLguJTguJ_guYnguLKSARhlbWVyZ2VuY3lfY2FyZV9waHlzaWNpYW7gAQA!16s%2Fg%2F11jrn_pjvp?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	%T5OPI0o	\N	ES_226	\N	\N	18.8221526	99.015597	กู้ชีพหยาดฟ้า	EM01	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
407	ไม่ระบุ	\N	google.com/maps/place/โรงพยาบาลค่ายกาวิละ/@18.7637835,98.9483965,29785m/data=!3m1!1e3!4m6!3m5!1s0x30da301c0628c253:0x210e680bc27f6622!8m2!3d18.7780238!4d99.0144532!16s%2Fg%2F1hc7nmxzd?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	jyRQz#3V	\N	ES_407	\N	\N	\N	\N	โรงพยาบาลค่ายกาวิละ	EM02	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
334	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%9B%E0%B9%89%E0%B8%AD%E0%B8%87%E0%B8%81%E0%B8%B1%E0%B8%99%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%9A%E0%B8%A3%E0%B8%A3%E0%B9%80%E0%B8%97%E0%B8%B2%E0%B8%AA%E0%B8%B2%E0%B8%98%E0%B8%B2%E0%B8%A3%E0%B8%93%E0%B8%A0%E0%B8%B1%E0%B8%A2%E0%B8%81%E0%B8%B9%E0%B9%89%E0%B8%8A%E0%B8%B5%E0%B8%9E-%E0%B8%81%E0%B8%B9%E0%B9%89%E0%B8%A0%E0%B8%B1%E0%B8%A2%E0%B8%A3%E0%B9%89%E0%B8%AD%E0%B8%87%E0%B8%A7%E0%B8%B1%E0%B8%A7%E0%B9%81%E0%B8%94%E0%B8%87/@18.741759,99.1822623,3724m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30d9878a2b035941:0x71ed2e68c0fc36ac!8m2!3d18.7417593!4d99.1925406!16s%2Fg%2F11rl84fyzw?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	T&Pvp9mQ	\N	ES_334	\N	\N	18.7417593	99.1925406	กู้ชีพร้องวัวแดง	EM01	13	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
401	ไม่ระบุ	\N	#	SIwW%4aE	\N	ES_401	\N	\N	\N	\N	เทศบาลตำบลบ่อหลวง	EM01	16	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
402	ไม่ระบุ	\N	#	Zpk!U4*g	\N	ES_402	\N	\N	\N	\N	องค์การบริหารส่วนตำบลบ่อสลี	EM01	16	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
269	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B8%AD%E0%B8%87%E0%B8%84%E0%B9%8C%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%9A%E0%B8%A3%E0%B8%B4%E0%B8%AB%E0%B8%B2%E0%B8%A3%E0%B8%AA%E0%B9%88%E0%B8%A7%E0%B8%99%E0%B8%95%E0%B8%B3%E0%B8%9A%E0%B8%A5%E0%B9%81%E0%B8%A1%E0%B9%88%E0%B8%97%E0%B8%B2/@18.5884031,99.253653,3727m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30d981e5b2085d7f:0x12f758cb9f048b01!8m2!3d18.5884034!4d99.2639313!16s%2Fg%2F11b8jd5_kg?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	9LK#i2EM	\N	ES_269	\N	\N	18.5884034	99.2639313	องค์การบริหารส่วนตำบลแม่ทา	EM01	23	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
234	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B8%A8%E0%B8%B9%E0%B8%99%E0%B8%A2%E0%B9%8C%E0%B8%81%E0%B8%B9%E0%B9%89%E0%B8%A0%E0%B8%B1%E0%B8%A2%E0%B8%AD%E0%B8%B8%E0%B8%97%E0%B8%A2%E0%B8%B2%E0%B8%99%E0%B9%81%E0%B8%AB%E0%B9%88%E0%B8%87%E0%B8%8A%E0%B8%B2%E0%B8%95%E0%B8%B4%E0%B8%97%E0%B8%B5%E0%B9%88+1+%E0%B9%80%E0%B8%8A%E0%B8%B5%E0%B8%A2%E0%B8%87%E0%B9%83%E0%B8%AB%E0%B8%A1%E0%B9%88/@18.7493778,98.906706,3723m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30da375d0ca14161:0x61b32e0f778d7f63!8m2!3d18.7493781!4d98.9169843!16s%2Fg%2F11g0ll7gzh?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	p!LX9mS&	\N	ES_234	\N	\N	18.7493781	98.9169843	ศูนย์กู้ภัยอุทยานแห่งชาติที่ 1 อำเภอเมือง	EM01	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
223	ไม่ระบุ	\N	#	8Pj&gTox	\N	ES_223	\N	\N	\N	\N	เทศบาลตำบลสุเทพ	EM01	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
229	ไม่ระบุ	\N	#	AP6L5bY*	\N	ES_229	\N	\N	\N	\N	เทศบาลตำบลหนองหอย	EM01	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
237	ไม่ระบุ	\N	#	lT&s3y$S	\N	ES_237	\N	\N	\N	\N	องค์การบริหารส่วนตำบลแม่ศึก 	EM01	3	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
250	ไม่ระบุ	\N	#	*G2i%kI1	\N	ES_250	\N	\N	\N	\N	องค์การบริหารส่วนตำบลป่าแป๋	EM01	6	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
261	ไม่ระบุ	\N	#	in&Jrz73	\N	ES_261	\N	\N	\N	\N	องค์การบริหารส่วนตำบลสะลวง	EM01	7	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
274	ไม่ระบุ	\N	#	ar0_Y#QJ	\N	ES_274	\N	\N	\N	\N	องค์การบริหารส่วนตำบลท่าตอน 	EM01	10	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
283	ไม่ระบุ	\N	#	d45q6Z%F	\N	ES_283	\N	\N	\N	\N	องค์การบริหารส่วนตำบลศรีดงเย็น	EM01	21	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
287	ไม่ระบุ	\N	#	sq&wQn3J	\N	ES_287	\N	\N	\N	\N	เทศบาลตำบลแม่สอย	EM01	2	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
294	ไม่ระบุ	\N	#	UgjL%5J9	\N	ES_294	\N	\N	\N	\N	เทศบาลตำบลดอนแก้ว	EM01	25	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
301	ไม่ระบุ	\N	#	98b!OVME	\N	ES_301	\N	\N	\N	\N	เทศบาลตำบลสำราญราษฎร์	EM01	5	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
310	ไม่ระบุ	\N	#	50Dd6V&k	\N	ES_310	\N	\N	\N	\N	องค์การบริหารส่วนตำบลเทพเสด็จ	EM01	5	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
320	ไม่ระบุ	\N	#	4fIVD2&U	\N	ES_320	\N	\N	\N	\N	เทศบาลตำบลสันทราย	EM01	9	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
327	ไม่ระบุ	\N	#	jkv$zAD3	\N	ES_327	\N	\N	\N	\N	เทศบาลตำบลบ้านแม่ข่า	EM01	9	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
338	ไม่ระบุ	\N	#	C_3bFrtT	\N	ES_338	\N	\N	\N	\N	เทศบาลเมืองต้นเปา	EM01	13	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
343	ไม่ระบุ	\N	#	tFv7_fCw	\N	ES_343	\N	\N	\N	\N	องค์การบริหารส่วนตำบลแช่ช้าง	EM01	13	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
352	ไม่ระบุ	\N	#	bel#5*E3	\N	ES_352	\N	\N	\N	\N	เทศบาลตำบลหนองจ๊อม	EM01	14	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
359	ไม่ระบุ	\N	#	xh2&3Ols	\N	ES_359	\N	\N	\N	\N	องค์การบริหารส่วนตำบลสันกลาง	EM01	12	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
368	ไม่ระบุ	\N	#	M%aol5FV	\N	ES_368	\N	\N	\N	\N	องค์การบริหารส่วนตำบลน้ำบ่อหลวง	EM01	12	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
380	ไม่ระบุ	\N	#	Zu$E8gHU	\N	ES_380	\N	\N	\N	\N	เทศบาลตำบลสันทรายมหาวงศ์	EM01	19	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
389	ไม่ระบุ	\N	#	&U#1gOlI	\N	ES_389	\N	\N	\N	\N	เทศบาลตำบลสันผักหวาน	EM01	15	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
398	ไม่ระบุ	\N	#	1aDL8QV%	\N	ES_398	\N	\N	\N	\N	องค์การบริหารส่วนตำบลแม่ตื่น	EM01	18	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
400	ไม่ระบุ	\N	#	q7@OyA_j	\N	ES_400	\N	\N	\N	\N	องค์การบริหารส่วนตำบลอมก๋อย	EM01	18	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
330	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B8%A8%E0%B8%B9%E0%B8%99%E0%B8%A2%E0%B9%8C%E0%B8%81%E0%B8%B9%E0%B9%89%E0%B8%8A%E0%B8%B5%E0%B8%9E-%E0%B8%81%E0%B8%B9%E0%B9%89%E0%B8%A0%E0%B8%B1%E0%B8%A2%E0%B8%9E%E0%B8%A3%E0%B9%89%E0%B8%B2%E0%B8%A7%E0%B8%A7%E0%B8%B1%E0%B8%87%E0%B8%AB%E0%B8%B4%E0%B8%99/@19.3618994,99.1907883,3710m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30d755382a187137:0xd1a4d145df256543!8m2!3d19.3618997!4d99.2010666!16s%2Fg%2F11pwblj1_s?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	Wf0QH#u9	\N	ES_330	\N	\N	19.3618997	99.2010666	กู้ภัยพร้าววังหิน	EM01	11	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
232	ไม่ระบุ	\N	google.com/maps/place/มูลนิธิรวมใจเชียงใหม่(สำนักงานแห่งใหม่)+RUAMJAI+FOUNDATION/@18.7558899,99.0038954,825m/data=!3m1!1e3!4m10!1m2!2m1!1z4Lih4Li54Lil4LiZ4Li04LiY4Li04Lij4Lin4Lih4LmD4LiI!3m6!1s0x30da3164fdf7ac4f:0x988899643c46fa44!8m2!3d18.7558817!4d99.0038107!15sCiTguKHguLnguKXguJnguLTguJjguLTguKPguKfguKHguYPguIhaJyIl4Lih4Li54Lil4LiZ4Li04LiY4Li0IOC4o-C4p-C4oeC5g-C4iJIBEGNvcnBvcmF0ZV9vZmZpY2WaASNDaFpEU1VoTk1HOW5TMFZKUTBGblNVUm9kbk5FWlU1UkVBReABAPoBBAhsEDU!16s%2Fg%2F11j7ygp1xs?entry=ttu&g_ep=EgoyMDI2MDkwOS4wIKXMDSoASAFQAw%3D%3D	s7&AbtPK	\N	ES_232	\N	\N	\N	\N	มูลนิธิรวมใจ	EM01	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
281	ไม่ระบุ	\N	google.com/maps/place/โรงพยาบาลส่งเสริมสุขภาพ+บ้านสันป่าแดง+ต.แม่สูน+อ.ฝาง+จ.เชียงใหม่/@16.550184,100.2267729,854841m/data=!3m1!1e3!4m10!1m2!2m1!1z4LmC4Lij4LiH4Lie4Lii4Liy4Lia4Liy4Lil4Liq4LmI4LiH4LmA4Liq4Lij4Li04Lih4Liq4Li44LiC4Lig4Liy4Lie4LiV4Liz4Lia4Lil4Lia4LmJ4Liy4LiZ4Lib4LmI4Liy4LmB4LiU4LiH!3m6!1s0x30d0ccf48710421f:0x1bf831bbd2a325a8!8m2!3d19.8363513!4d99.1509929!15sCm_guYLguKPguIfguJ7guKLguLLguJrguLLguKXguKrguYjguIfguYDguKrguKPguLTguKHguKrguLjguILguKDguLLguJ7guJXguLPguJrguKXguJrguYnguLLguJnguJvguYjguLLguYHguJTguIeSAQhob3NwaXRhbOABAA!16s%2Fg%2F11bzzyl4f7?entry=ttu&g_ep=EgoyMDI2MDkwOS4wIKXMDSoASAFQAw%3D%3D	#!P56m9l	\N	ES_281	\N	\N	\N	\N	โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านป่าแดง	EM01	21	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
205	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B8%AD%E0%B8%87%E0%B8%84%E0%B9%8C%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%9A%E0%B8%A3%E0%B8%B4%E0%B8%AB%E0%B8%B2%E0%B8%A3%E0%B8%AA%E0%B9%88%E0%B8%A7%E0%B8%99%E0%B8%95%E0%B8%B3%E0%B8%9A%E0%B8%A5%E0%B8%97%E0%B8%B8%E0%B9%88%E0%B8%87%E0%B8%9B%E0%B8%B5%E0%B9%8A/@18.586061,98.800656,825m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30da4b35baa8274b:0x731d3c9e4a7a3a27!8m2!3d18.586061!4d98.800656!16s%2Fg%2F1hc4tq1sy?entry=ttu&g_ep=EgoyMDI2MDkwOS4wIKXMDSoASAFQAw%3D%3D	3Zra#zI&	\N	ES_205	\N	\N	18.586061	98.800656	องค์การบริหารส่วนตำบลทุ่งปี้	EM01	22	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	2026-09-15 19:02:13.585296
206	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B8%97%E0%B8%B3%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%AD%E0%B8%87%E0%B8%84%E0%B9%8C%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%9A%E0%B8%A3%E0%B8%B4%E0%B8%AB%E0%B8%B2%E0%B8%A3%E0%B8%AA%E0%B9%88%E0%B8%A7%E0%B8%99%E0%B8%95%E0%B8%B3%E0%B8%9A%E0%B8%A5%E0%B8%94%E0%B8%AD%E0%B8%99%E0%B9%80%E0%B8%9B%E0%B8%B2/@18.6055155,98.814909,825m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30da4ab58c8faa81:0x33fbb3a279cbcea!8m2!3d18.6055155!4d98.814909!16s%2Fg%2F1hc1ww401?entry=ttu&g_ep=EgoyMDI2MDkwOS4wIKXMDSoASAFQAw%3D%3D	y&j6FU0!	\N	ES_206	\N	\N	18.6055155	98.814909	องค์การบริหารส่วนตำบลดอนเปา	EM01	22	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	2026-09-15 19:02:15.177653
227	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B8%AA%E0%B8%A1%E0%B8%B2%E0%B8%84%E0%B8%A1%E0%B8%81%E0%B8%B9%E0%B9%89%E0%B8%A0%E0%B8%B1%E0%B8%A2%E0%B8%A3%E0%B9%88%E0%B8%A7%E0%B8%A1%E0%B8%A5%E0%B9%89%E0%B8%B2%E0%B8%99%E0%B8%99%E0%B8%B2%E0%B9%80%E0%B8%8A%E0%B8%B5%E0%B8%A2%E0%B8%87%E0%B9%83%E0%B8%AB%E0%B8%A1%E0%B9%88/@18.7600801,98.9966494,825m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30da310043a3d6b9:0x5dc5a8065c9f327c!8m2!3d18.7600801!4d98.9966494!16s%2Fg%2F11v_4w5lm3?entry=ttu&g_ep=EgoyMDI2MDkwOS4wIKXMDSoASAFQAw%3D%3D	MyrZ_w8#	\N	ES_227	\N	\N	18.7600801	98.9966494	กู้ชีพร่วมล้านนา	EM01	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	2026-09-15 19:02:16.360203
278	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B8%A8%E0%B8%B9%E0%B8%99%E0%B8%A2%E0%B9%8C%E0%B8%81%E0%B8%B9%E0%B9%89%E0%B8%A0%E0%B8%B1%E0%B8%A2%E0%B9%80%E0%B8%A7%E0%B8%B5%E0%B8%A2%E0%B8%87%E0%B8%A1%E0%B8%B0%E0%B8%A5%E0%B8%B4%E0%B8%81%E0%B8%B2/@20.037154,99.3137734,818m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30d72901fd3b0807:0x702c1b921b29bdfb!8m2!3d20.037154!4d99.3137734!16s%2Fg%2F11nwc4dwjb?entry=ttu&g_ep=EgoyMDI2MDkwOS4wIKXMDSoASAFQAw%3D%3D	sQe1$noD	\N	ES_278	\N	\N	20.037154	99.3137734	กู้ชีพเวียงมะลิกา	EM01	10	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	2026-09-15 19:02:17.723614
204	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B9%80%E0%B8%97%E0%B8%A8%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B8%95%E0%B8%B3%E0%B8%9A%E0%B8%A5%E0%B8%AA%E0%B8%B1%E0%B8%99%E0%B9%82%E0%B8%9B%E0%B9%88%E0%B8%87/@18.9426376,98.9433395,824m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30da3dc12e9ae863:0xf4f99f6240e39342!8m2!3d18.9426376!4d98.9433395!16s%2Fg%2F1pzxpb_rs?entry=ttu&g_ep=EgoyMDI2MDkwOS4wIKXMDSoASAFQAw%3D%3D	XJQg_T9I	\N	ES_204	\N	\N	18.9426376	98.9433395	เทศบาลตำบลสันโป่ง	EM01	7	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	2026-09-15 19:02:12.235489
288	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B9%82%E0%B8%A3%E0%B8%87%E0%B8%9E%E0%B8%A2%E0%B8%B2%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B8%AA%E0%B9%88%E0%B8%87%E0%B9%80%E0%B8%AA%E0%B8%A3%E0%B8%B4%E0%B8%A1%E0%B8%AA%E0%B8%B8%E0%B8%82%E0%B8%A0%E0%B8%B2%E0%B8%9E%E0%B8%95%E0%B8%B3%E0%B8%9A%E0%B8%A5%E0%B8%9A%E0%B9%89%E0%B8%B2%E0%B8%99%E0%B8%99%E0%B8%B2%E0%B8%81%E0%B8%9A-%E0%B8%AA%E0%B8%9A%E0%B9%81%E0%B8%9B%E0%B8%B0/@18.264042,98.6298771,827m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30dba3d5fd07f63b:0x716a6262c9e68194!8m2!3d18.264042!4d98.6298771!16s%2Fg%2F11fqc7ypx9?entry=ttu&g_ep=EgoyMDI2MDkwOS4wIKXMDSoASAFQAw%3D%3D	5N2#b*UR	\N	ES_288	\N	\N	18.264042	98.6298771	โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านสบแปะ	EM01	2	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	2026-09-15 19:02:18.872125
307	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B8%A1%E0%B8%B9%E0%B8%A5%E0%B8%99%E0%B8%B4%E0%B8%98%E0%B8%B4%E0%B8%AA%E0%B8%A7%E0%B9%88%E0%B8%B2%E0%B8%87%E0%B8%AA%E0%B8%B3%E0%B9%80%E0%B8%A3%E0%B9%87%E0%B8%88%E0%B9%80%E0%B8%8A%E0%B8%B5%E0%B8%A2%E0%B8%87%E0%B9%83%E0%B8%AB%E0%B8%A1%E0%B9%88/@18.8188981,99.0842378,824m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30da25f97c28d047:0x7b79b274318ab049!8m2!3d18.8188981!4d99.0842378!16s%2Fg%2F11hz0wx4zr?entry=ttu&g_ep=EgoyMDI2MDkwOS4wIKXMDSoASAFQAw%3D%3D	*TglfAV9	\N	ES_307	\N	\N	18.8188981	99.0842378	มูลนิธิสว่างสำเร็จเชียงใหม่	EM01	5	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	2026-09-15 19:02:19.979243
326	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B8%A3%E0%B8%9E.%E0%B8%AA%E0%B8%95.%E0%B8%AD%E0%B9%88%E0%B8%B2%E0%B8%87%E0%B8%82%E0%B8%B2%E0%B8%87/@19.9003087,99.041274,819m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30d0cf7fb2348967:0x19fd33b842e81824!8m2!3d19.9003087!4d99.041274!16s%2Fg%2F11smphgrd4?entry=ttu&g_ep=EgoyMDI2MDkwOS4wIKXMDSoASAFQAw%3D%3D	Ob1q@H2E	\N	ES_326	\N	\N	19.9003087	99.041274	รพ.สต.อ่างขาง	EM01	9	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	2026-09-15 19:02:21.418329
328	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B8%A8%E0%B8%B9%E0%B8%99%E0%B8%A2%E0%B9%8C%E0%B8%AA%E0%B8%B2%E0%B8%98%E0%B8%B2%E0%B8%A3%E0%B8%93%E0%B8%AA%E0%B8%B8%E0%B8%82%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B9%81%E0%B8%9E%E0%B8%97%E0%B8%A2%E0%B9%8C%E0%B9%81%E0%B8%A1%E0%B9%88%E0%B8%82%E0%B9%88%E0%B8%B2/@19.7851065,99.1633996,819m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30d0cb14b5d2cbb1:0xdbedb4ac7dd84b0e!8m2!3d19.7851065!4d99.1633996!16s%2Fg%2F1hf1y_lqf?entry=ttu&g_ep=EgoyMDI2MDkwOS4wIKXMDSoASAFQAw%3D%3D	D9nG%@Uv	\N	ES_328	\N	\N	19.7851065	99.1633996	รพ.สต.บ้านแม่ข่า	EM01	9	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	2026-09-15 19:02:22.863592
332	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B9%82%E0%B8%A3%E0%B8%87%E0%B8%9E%E0%B8%A2%E0%B8%B2%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B8%AA%E0%B9%88%E0%B8%87%E0%B9%80%E0%B8%AA%E0%B8%A3%E0%B8%B4%E0%B8%A1%E0%B8%AA%E0%B8%B8%E0%B8%82%E0%B8%A0%E0%B8%B2%E0%B8%9E%E0%B8%95%E0%B8%B3%E0%B8%9A%E0%B8%A5%E0%B8%9A%E0%B9%89%E0%B8%B2%E0%B8%99%E0%B8%97%E0%B8%B8%E0%B9%88%E0%B8%87%E0%B8%AB%E0%B8%A5%E0%B8%A7%E0%B8%87/@19.3642427,99.1992537,822m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30d755373968313d:0xd2caf9eea019c1b4!8m2!3d19.3642427!4d99.1992537!16s%2Fg%2F1pzxwrpcm?entry=ttu&g_ep=EgoyMDI2MDkwOS4wIKXMDSoASAFQAw%3D%3D	p@qE2RV6	\N	ES_332	\N	\N	19.3642427	99.1992537	โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านทุ่งหลวง	EM01	11	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	2026-09-15 19:02:23.997743
422	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B9%82%E0%B8%A3%E0%B8%87%E0%B8%9E%E0%B8%A2%E0%B8%B2%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B8%9D%E0%B8%B2%E0%B8%87/@19.9133292,99.2064742,819m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30d72d4353fa8665:0x62816b9011b22397!8m2!3d19.9133292!4d99.2064742!16s%2Fg%2F1tfq1537?entry=ttu&g_ep=EgoyMDI2MDkwOS4wIKXMDSoASAFQAw%3D%3D	6E%x5nOS	\N	ES_422	\N	\N	19.9133292	99.2064742	โรงพยาบาลฝาง	EM02	9	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	2026-09-15 19:02:25.165555
427	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B9%82%E0%B8%A3%E0%B8%87%E0%B8%9E%E0%B8%A2%E0%B8%B2%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B9%81%E0%B8%A1%E0%B9%88%E0%B8%95%E0%B8%B7%E0%B9%88%E0%B8%99/@17.4030863,98.4563211,831m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30dcf5d1d646c8b9:0xcfca964caad077d0!8m2!3d17.4030863!4d98.4563211!16s%2Fg%2F11gy9xb0k7?entry=ttu&g_ep=EgoyMDI2MDkwOS4wIKXMDSoASAFQAw%3D%3D	8oBzg$#M	\N	ES_427	\N	\N	17.4030863	98.4563211	โรงพยาบาลแม่ตื่น	EM02	18	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	2026-09-15 19:02:26.302591
428	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B9%82%E0%B8%A3%E0%B8%87%E0%B8%9E%E0%B8%A2%E0%B8%B2%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B8%AD%E0%B8%A1%E0%B8%81%E0%B9%8B%E0%B8%AD%E0%B8%A2/@17.8019723,98.3612098,829m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30dc83a3120fe0b3:0x151bfe2753e92630!8m2!3d17.8019723!4d98.3612098!16s%2Fg%2F1t_gblld?entry=ttu&g_ep=EgoyMDI2MDkwOS4wIKXMDSoASAFQAw%3D%3D	iw98x*3W	\N	ES_428	\N	\N	17.8019723	98.3612098	โรงพยาบาลอมก๋อย	EM02	18	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	2026-09-15 19:02:27.414108
233	88/8-9 ถ. ซุปเปอร์ไฮเวย์ เชียงใหม่-ลำปาง ตำบลหนองป่าครั่ง อำเภอเมืองเชียงใหม่ เชียงใหม่ 50000	\N	https://www.google.com/maps/place/%E0%B9%82%E0%B8%A3%E0%B8%87%E0%B8%9E%E0%B8%A2%E0%B8%B2%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B8%81%E0%B8%A3%E0%B8%B8%E0%B8%87%E0%B9%80%E0%B8%97%E0%B8%9E+%E0%B9%80%E0%B8%8A%E0%B8%B5%E0%B8%A2%E0%B8%87%E0%B9%83%E0%B8%AB%E0%B8%A1%E0%B9%88/@18.7887107,99.0236093,17z/data=!3m1!4b1!4m6!3m5!1s0x30da255ae7380ae7:0x3bfcce7acc45cfac!8m2!3d18.7887107!4d99.0261842!16s%2Fg%2F11b5qzjkp2?entry=ttu&g_ep=EgoyMDI2MDkwOS4wIKXMDSoASAFQAw%3D%3D	YzhRo8@D	0000000000	ES_233	\N	https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80	18.7887107	99.0236093	โรงพยาบาลกรุงเทพเชียงใหม่2	EM01	1	active	\N	{"monday":{"active":true,"open":"00:00","close":"23:59"},"tuesday":{"active":true,"open":"00:00","close":"23:59"},"wednesday":{"active":true,"open":"00:00","close":"23:59"},"thursday":{"active":true,"open":"00:00","close":"23:59"},"friday":{"active":true,"open":"00:00","close":"23:59"},"saturday":{"active":true,"open":"00:00","close":"23:59"},"sunday":{"active":true,"open":"00:00","close":"23:59"}}	[]	2026-08-25 00:00:00	2026-09-15 23:02:43.877644
SKYDOC-INTHANON-01	สถานีรายงานดอยอินทนนท์ กองทัพอากาศ ต.บ้านหลวง อ.จอมทอง จ.เชียงใหม่	ศูนย์ประสานงานกู้ชีพนเรนทรเชียงใหม่ / รพ.มหาราชนครเชียงใหม่	https://www.google.com/maps/place/Parking+Place/@18.5894022,98.4869387,68m/data=!3m1!1e3!4m14!1m7!3m6!1s0x30dbaa9c1c7fd96b:0xf3f01fb3a96c7054!2z4LiU4Lit4Lii4Lit4Li04LiZ4LiX4LiZ4LiZ4LiX4LmM!8m2!3d18.5880431!4d98.4870612!16zL20vMDFmMXMx!3m5!1s0x30dbabb21c20bb29:0x42032d8b4bb07c13!8m2!3d18.5894125!4d98.4868594!16s%2Fg%2F11gs949bmt?entry=ttu&g_ep=EgoyMDI2MDkxMy4wIKXMDSoASAFQAw%3D%3D	\N	1669	\N	ลานจอดเฮลิคอปเตอร์กู้ชีพฉุกเฉินทางอากาศ (Sky Doctor) รองรับการเคลื่อนย้ายผู้ป่วยฉุกเฉินวิกฤตบนพื้นที่ดอยสูงส่งต่อโรงพยาบาลศูนย์	\N	18.5894125	98.4868594	จุดบริการการแพทย์ฉุกเฉินทางอากาศ Sky Doctor ยอดดอยอินทนนท์	EM02	3	active	\N	\N	\N	2026-09-16 16:54:30.496104	2026-09-17 00:03:38.70923
SKYDOC-KIWFIN-02	หน่วยพิทักษ์อุทยานแห่งชาติแจ้ซ้อน (กิ่วฝิ่น) อ.แม่ออน เชียงใหม่ / อ.เมืองปาน ลำปาง	ศูนย์รับแจ้งเหตุและสั่งการการแพทย์ฉุกเฉิน 1669	https://www.google.com/maps/place/%E0%B8%81%E0%B8%B4%E0%B9%88%E0%B8%A7%E0%B8%9D%E0%B8%B4%E0%B9%88%E0%B8%99/@18.8543646,99.3639752,824m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30d98e00252c87e9:0xe7cb864f69e170ad!8m2!3d18.8543646!4d99.3665501!16s%2Fg%2F11b6x4gslc?entry=ttu&g_ep=EgoyMDI2MDkxMy4wIKXMDSoASAFQAw%3D%3D	\N	1669	\N	จุดประสานและลานรับ-ส่งต่อผู้ป่วยฉุกเฉินทางอากาศแนวสันเขา กิ่วฝิ่น-แม่กำปอง เพื่อลดระยะเวลาส่งต่อโรงพยาบาลจากเส้นทางเขาสูงชัน	\N	18.8543646	99.3665501	จุดบริการการแพทย์ฉุกเฉินทางอากาศ Sky Doctor กิ่วฝิ่น แม่กำปอง	EM02	23	active	\N	\N	\N	2026-09-16 16:54:30.496104	2026-09-16 16:54:30.496104
\.


--
-- Data for Name: favorite_wellness_hub; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.favorite_wellness_hub (member_id, license_id) FROM stdin;
1	1
1	56
1	50
1	71
\.


--
-- Data for Name: main_route_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.main_route_categories (route_id, category_id) FROM stdin;
11	C04
11	C01
11	EM02
11	EM01
12	C05
12	EM02
12	EM01
12	C03
14	C05
14	C01
14	EM02
14	EM01
14	C02
13	C04
13	C05
13	EM02
13	EM01
\.


--
-- Data for Name: main_route_details; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.main_route_details (id, order_number, district_id, route_id) FROM stdin;
316	1	4	11
317	2	7	11
318	3	1	11
319	4	5	11
320	5	23	11
321	6	12	11
322	1	4	12
323	2	7	12
324	3	1	12
325	4	19	12
326	5	13	12
327	6	5	12
328	7	23	12
329	1	7	14
330	2	1	14
331	3	15	14
332	4	19	14
333	5	13	14
334	6	23	14
340	1	11	13
341	2	7	13
342	3	1	13
343	4	12	13
344	5	23	13
\.


--
-- Data for Name: main_routes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.main_routes (route_id, route_description, route_name, created_by, created_at, updated_at, pin_count, route_image) FROM stdin;
11	Massage & Spa City	Massage & Spa City	admin	2026-07-30 20:17:29.559121	2026-11-01 19:29:50.202002	61	https://csljpnypebwjgvoygqov.supabase.co/storage/v1/object/public/WELLNESS-IMAGES/routes/c15b2821-6d2d-4dfd-8645-0cccd0decdc1.png
12	อาหารและกิจกรรม	Chiang Mai Food & Craft	admin	2026-07-31 19:02:19.275662	2026-11-01 19:30:26.529578	42	https://csljpnypebwjgvoygqov.supabase.co/storage/v1/object/public/WELLNESS-IMAGES/routes/e698d05f-5574-4f56-ae68-141172940bfe.png
14		ดูแลกายให้ภูมิปัญญาช่วยดูแล	admin	2026-08-06 22:27:13.818124	2026-11-01 19:31:08.188951	93	https://csljpnypebwjgvoygqov.supabase.co/storage/v1/object/public/WELLNESS-IMAGES/routes/6427e3b3-0824-4552-9fdf-da48e4be593b.png
13		ฮีลใจในอ้อมกอดธรรมชาติ	admin	2026-08-06 22:22:56.209667	2026-11-01 19:31:44.424586	33	https://csljpnypebwjgvoygqov.supabase.co/storage/v1/object/public/WELLNESS-IMAGES/routes/bd96b41c-2d08-4248-8dfe-7deaecd8a7a8.png
\.


--
-- Data for Name: member; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.member (member_id, email, first_name, last_name, password, profile_image) FROM stdin;
2	test2@gmail.com	Somsri	Jaidee	123456	
3	test3@gmail.com	Somchai	Jaidee	123456	
4	sdfsdgdgtfhyh@gmail.com	ddd	fff	123456	
5	asdfgh@gmail.com	asdfgh	jaideee	123456	
6	test10@gmail.com	555	555	123456	
1	test1@gmail.com	Kritchirat	Thunkitchai	1234	/uploads/profiles/7aecffa1-7299-4872-bf11-b7ae526df71d.jpg
7	kritjirattkj@gmail.com	Kritchirat	Thun	Krit_1234	
\.


--
-- Data for Name: my_travel_trip; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.my_travel_trip (travel_trip_id, description, trip_name, article_id, member_id, origin_district_id, destination_district_id, duplicated_from_trip_id, original_member_id) FROM stdin;
5		แม่แจ่ม	\N	1	1	3	\N	\N
6		เมือง - ดอยสะเก็ด	\N	1	1	5	\N	\N
7		เมือง	\N	1	1	5	\N	\N
8		เมือง	\N	1	1	5	\N	\N
9		เมือง	\N	1	1	5	7	1
10		วันนี้ไปเที่ยวมาค่ะ	\N	1	1	5	\N	\N
11		วันนี้ไปเที่ยวมาค่ะ	\N	1	1	5	\N	\N
12		วันนี้ไปเที่ยวมาค่ะ	\N	1	1	5	11	1
\.


--
-- Data for Name: my_travel_trip_detail; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.my_travel_trip_detail (travel_trip_id, license_id, travel_trip_index) FROM stdin;
7	48	1
7	86	2
5	87	1
5	94	2
5	96	3
5	62	4
7	87	3
7	96	4
7	94	5
7	11	6
7	3	7
7	28	8
6	86	1
6	87	2
6	94	3
6	96	4
6	429	5
6	62	6
6	3	7
6	28	8
7	62	9
7	58	10
7	83	11
8	48	1
8	86	2
8	87	3
8	96	4
8	94	5
8	11	6
8	3	7
8	28	8
8	62	9
8	58	10
8	83	11
9	86	1
9	87	2
9	96	3
9	94	4
9	11	5
9	3	6
9	28	7
9	62	8
9	58	9
9	83	10
10	86	1
11	86	1
10	11	2
11	11	2
10	48	3
11	48	3
10	101	4
11	101	4
12	11	1
12	48	2
12	101	3
\.


--
-- Data for Name: notification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification (notification_id, message_body, notification_status, notifydate, request_id) FROM stdin;
1	ส่งอีเมลแจ้งผลการอนุมัติสำเร็จ: ทดสอบ1	SENT	2026-10-27 13:28:54.607538	1
\.


--
-- Data for Name: official_articles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.official_articles (article_id, article_category, article_detail, article_title, author, img, publish_date, article_images, attachment_files) FROM stdin;
17	กิจกรรมสุขภาพ	เชียงใหม่เป็นเมืองท่องเที่ยวสำคัญทางภาคเหนือที่เต็มไปด้วยวัฒนธรรมล้านนา ธรรมชาติ และภูเขา\\n\\n1. สถานดึงดูดใจยอดนิยม\\n• ดอยอินทนนท์: จุดสูงสุดของประเทศไทย สูง 2,565 เมตร มีเส้นทางศึกษาธรรมชาติกิ่วแม่ปานที่สวยงาม\\n• วัดพระธาตุดอยสุเทพราชวรวิหาร: วัดคู่บ้านคู่เมืองเชียงใหม่ อายุกว่า 600 ปี\\n• บ้านแม่กำปอง: หมู่บ้านในหุบเขา สัมผัสวิถีชีวิตธรรมชาติและอากาศเย็นสบายตลอดปี\\n• ม่อนแจ่ม (Mon Jam): จุดชมวิว ทุ่งดอกไม้ และคาเฟ่บนยอดดอยในอำเภอแม่ริม\\n• วัดในตัวเมือง: เช่น วัดเจดีย์หลวง, วัดพระสิงห์ และวัดเชียงมั่น ที่สะท้อนศิลปะล้านนา\\n\\n2. ของฝากขึ้นชื่อ\\n• อาหารและของกิน: แคบหมู น้ำพริกหนุ่ม และไส้อั่ว\\n• สินค้าเกษตร: กาแฟดอย และผลไม้อบแห้งหรือลำไยอบแห้ง\\n• หัตถกรรม: ผ้าทอพื้นเมืองและเสื้อผ้าสไตล์ล้านนา	บทความน่ารู้today 2026	admin02	https://mzuwvqwcymwfyjdirhst.supabase.co/storage/v1/object/public/WELLNESS-IMAGES/articles/89283b65-fa1d-44f1-bb50-ce551cd74434.jpg	2026-09-17 09:58:53.600639	["https://mzuwvqwcymwfyjdirhst.supabase.co/storage/v1/object/public/WELLNESS-IMAGES/articles/ab536fac-311b-4d84-98f8-9cd2459bb99d.jpg","https://mzuwvqwcymwfyjdirhst.supabase.co/storage/v1/object/public/WELLNESS-IMAGES/articles/7085473e-7c51-4e05-add6-59d4a38f3824.jpg"]	\N
8	ข่าวประชาสัมพันธ์	เปิดเส้นทางท่องเที่ยวเชิงสุขภาพ (Wellness Tourism) จังหวัดเชียงใหม่ เชื่อมโยง 3 อำเภอหลัก "เมือง - สันกำแพง - แม่ออน" ผสานการพักผ่อน ภูมิปัญญาท้องถิ่น และบริการสุขภาพครบวงจร\\n\\n1. โซนอำเภอเมืองเชียงใหม่\\n• สถานประกอบการเพื่อสุขภาพ: 68 แห่ง (สปา 37 แห่ง, นวดเพื่อสุขภาพ/เสริมความงาม 31 แห่ง)\\n• สถานพยาบาล: รพ.กรุงเทพเชียงใหม่, รพ.เชียงใหม่ ราม\\n• ร้านอาหาร: เรือนคำอิน | ที่พัก: คลอสทู\\n• ของฝาก: แคบหมู, กาแฟ, น้ำผึ้ง, ชา, น้ำพริก, กาละแม\\n\\n2. โซนอำเภอสันกำแพง\\n• สถานที่ท่องเที่ยว: ชุมชนไทยยองบ้านป่าตาล, กลุ่มการท่องเที่ยวอนุรักษ์บ้านปง-ห้วยลาน\\n• สถานประกอบการเพื่อสุขภาพ: 10 แห่ง (นวดเพื่อสุขภาพ 10 แห่ง)\\n• ร้านอาหาร: ออนใต้ฟาร์ม | ที่พัก: โรงแรมเวลเนส เชียงใหม่, โฮมสเตย์บ้านปง-ห้วยลาน\\n• ของฝาก: ฟ้าทะลายโจร, ยาหม่อง, ชา, น้ำผึ้ง, แคบหมู\\n\\n3. โซนอำเภอแม่ออน\\n• สถานที่ท่องเที่ยว: น้ำพุร้อนสันกำแพง, ชุมชนแม่กำปอง\\n• สถานประกอบการเพื่อสุขภาพ: 2 แห่ง (สปา 1 แห่ง, นวดเพื่อสุขภาพ 1 แห่ง)\\n• ที่พัก: โฮมสเตย์แม่กำปอง, น้ำพุร้อนสันกำแพง\\n• ของฝาก: ข้าวซอยตัด, กาละแม, ยาหม่อง, กาแฟ, ชา\\n\\n📊 สรุปข้อมูลเชิงเศรษฐกิจ\\n• ผลิตภัณฑ์ได้รับอนุญาตปี 66: 38 รายการ (ผ่าน 100%)\\n• มูลค่าผลผลิตประมาณการ: 128,431,000 บาท/ปี\\n\\n📋 แผนการดำเนินงาน (Action Plan)\\n• ก.ค.-ก.ย. 66: เฝ้าระวังมาตรฐานสถานประกอบการและฉลากผลิตภัณฑ์\\n• ต.ค.-ธ.ค. 66: บูรณาการลงพื้นที่พัฒนาแหล่งท่องเที่ยวเชิงสุขภาพใหม่ให้ครบวงจร	เส้นทางท่องเที่ยวเชิงสุขภาพ เชียงใหม่ (เมือง-สันกำแพง-แม่ออน)	admin02	https://mzuwvqwcymwfyjdirhst.supabase.co/storage/v1/object/public/WELLNESS-IMAGES/articles/b8d7d750-c819-44e8-b02e-7b6fdf17a044.jpg	2026-10-07 23:47:38.416492	[]	\N
\.


--
-- Data for Name: operating_hours; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.operating_hours (oph_id, close_time, day_of_week, open_time, request_id, license_id) FROM stdin;
\.


--
-- Data for Name: wellness_hubs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wellness_hubs (license_id, address, contact_information, google_maps_link, password, tel_information, username, wellness_hub_description, wellness_hub_img, wellness_hub_latitude, wellness_hub_longitude, wellness_hub_name, category_id, district_id, status, certificate_type, operating_hours, wellness_hub_gallery, created_at, updated_at) FROM stdin;
30	99 หมู่ที่15 ตรอก/ซอย- ถนน- ตำบลแม่วิน อำเภอแม่วาง เชียงใหม่ 50360	\N	https://maps.app.goo.gl/EtFkSXnKUfZuRist5	l$wBhix9	\N	WH_30	\N	\N	18.6569782	98.6825217	คลินิกการแพทย์แผนไทยและการแพทย์ทางเลือก รพ.สต.บ้านใหม่วังผาปูน	C02	22	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
28	489,489/1,489/3 ม.4 ต.แม่เหียะ เมืองเชียงใหม่ 50100	\N	https://maps.app.goo.gl/aniEdL7D2nw9djH7A	eW2h&q5E	\N	WH_28	\N	\N	18.7467094	98.9514795	หมอหญิงคลินิก	C02	1	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
31	41/6 ตรอก/ซอย6 ถนนลอยเคราะห์ ตำบลช้างคลาน อำเภอเมืองเชียงใหม่ เชียงใหม่ 50100	\N	https://maps.app.goo.gl/v5Z1as81DUVJW65b8	&3H4UsjP	\N	WH_31	\N	\N	18.7828766	99.0017846	พีฟลาวคลินิกเวชกรรม	C02	1	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
69	284 หมู่ที่ 3 ตรอก/ซอย- ถนนโชตนา ตำบลดอนแก้ว อำเภอแม่ริม เชียงใหม่ 50180	\N	https://maps.app.goo.gl/N39ZMNizUtyBWb2SA	Fi&xuN8s	\N	WH_69	\N	\N	18.863074	98.974358	ดิ อิมพีเรียล เชียงใหม่ รีสอร์ท แอนด์ สปอร์ตคลับ	C04	7	ACTIVE	ศูนย์เวลเนสประเภทที่พักนักท่องเที่ยว (Wellness Accommodation)	\N	\N	2026-08-25 00:00:00	\N
164	ไม่ระบุ	\N	#	*u8HW2ge	\N	WH_164	\N	\N	\N	\N	ร้านทหารกองหนุน	C03	2	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
171	ไม่ระบุ	\N	#	4Ej@Y5Ah	\N	WH_171	\N	\N	\N	\N	ครัวข้าวปั้น	C03	2	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
178	ไม่ระบุ	\N	#	pDn1!4%C	\N	WH_178	\N	\N	\N	\N	ร้านต๋าหลิ่ง	C03	2	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
11	88/8-9 หมู่ที่6 ถนนเชียงใหม่-ลำปาง ตำบลหนองป่าครั่ง อำเภอเมืองเชีย	\N	https://maps.app.goo.gl/68T81xStvjrDPNbq5	B4Hqvl%J	\N	WH_11	\N	https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80	18.7887429	99.026247	โรงพยาบาลกรุงเทพเชียงใหม่	C02	1	active	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	2026-09-15 19:54:45.289199
78	100 หมู่ที่7 ถนนแม่ริม-สะเมิง (1096) ตำบลริมใต้ อำเภอแม่ริม เชียงใหม่ 50180	\N	https://maps.app.goo.gl/TWA9AgCBWnhJ6yen8	aC3LD%HB	\N	WH_78	\N	\N	18.9212882	98.9293078	ห้องอาหารเอ็กซ์ออนเอิร์ธ	C03	7	ACTIVE	- ศูนย์เวลเนสประเภทภัตตาคาร (Wellness Restaurant) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
22	20/1 ถนนบุญเรืองฤทธิ์ ตำบลศรีภูมิ อำเภอเมืองเชียงใหม่ เชียงใหม่ 50200	\N	https://maps.app.goo.gl/2pzRDDBymQuhtsu66	Kkm$8OnA	\N	WH_22	\N	\N	18.7928912	98.977891	เชียงใหม่ราม คลินิกทันตกรรม	C02	1	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
3	159 หมู่ที่10 ถนนถนนโชตนา ตำบลดอนแก้ว อำเภอแม่ริม เชียงใหม่ 50180	@testinformation	https://maps.app.goo.gl/pGdfR6WPAGhsZJy76	tUzL1D7@	0123456789	WH_3	โรงพยาบาล	https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80	18.8523435	98.9683715	คลินิกการแพทย์แผนไทยและการแพทย์ทางเลือก โรงพยาบาลนครพิงค์	C02	1	ACTIVE	ศูนย์เวลเนสประเภทสปาเพื่อสุขภาพ (Wellness Spa)	{"monday":{"active":true,"open":"09:00","close":"18:00"},"tuesday":{"active":true,"open":"09:00","close":"18:00"},"wednesday":{"active":true,"open":"09:00","close":"18:00"},"thursday":{"active":true,"open":"09:00","close":"18:00"},"friday":{"active":true,"open":"09:00","close":"18:00"},"saturday":{"active":true,"open":"09:00","close":"18:00"},"sunday":{"active":false,"open":"","close":""}}	[]	2026-08-25 00:00:00	\N
101	11 หมู่ที่5 ตำบลท่าศาลา อำเภอเมืองเชียงใหม่ เชียงใหม่ 50000	\N	https://maps.app.goo.gl/dNCBQqLgY9kvuHQ68	MhP@6vlL	\N	WH_101	\N	https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80	18.7821548	99.0312479	โรงแรมเวลาดี เวลเนส เชียงใหม่	C04	1	active	- ศูนย์เวลเนสประเภทที่พักนักท่อ งเที่ยว (Wellness Accommodation) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	2026-09-15 19:15:00.070382
99	239 หมู่ที่7 ถนนเชียงใหม่-ฮอด ตำบลสุเทพ อำเภอเมืองเชียงใหม่ เชียงใหม่ 50200	\N	https://maps.app.goo.gl/i7eMgKfbQbbJGdJD7	C$4ix5Ue	\N	WH_99	\N	https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80	18.7653665	98.9741649	โรงแรมเวลเนสเชียงใหม่	C04	1	active	- ศูนย์เวลเนสประเภทที่พักนักท่อ งเที่ยว (Wellness Accommodation) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	2026-09-15 19:17:19.291347
48	125/3 หมู่ที่2 ตำบลป่าแดด อำเภอเมืองเชียงใหม่ เชียงใหม่ 50100	\N	https://maps.app.goo.gl/QQgtTVaUzQPEL34b7	!BVq5tz&	\N	WH_48	\N	https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80	18.7621008	98.9945955	ครัวเพชรดอยงามสวัสดีเจ้า	C03	1	active	ศูนย์เวลเนสประเภทภัตตาคาร (Wellness Restaurant)	\N	\N	2026-08-25 00:00:00	2026-09-15 19:18:56.361162
86	21 ถนนราชดำเนิน ตำบลพระสิงห์ อำเภอเมืองเชียงใหม่ เชียงใหม่ 50200	\N	https://maps.app.goo.gl/nGNmHmZ15jeaRFGq7	HzNa17c&	\N	WH_86	\N	https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80	18.7876619	98.9927386	ไทม์ ทู มาสสาจ	C01	1	active	- ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage), - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	2026-09-15 19:24:49.772458
70	100 หมู่ที่7 ถนนแม่ริม-สะเมิง (1096) ตำบลริมใต้ อำเภอแม่ริม เชียงใหม่ 50180	\N	https://maps.app.goo.gl/gMbV8eJttN8jD3nG9	zWb0&VPF	\N	WH_70	\N	https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80	18.9214904	98.9293079	โอรีแกนสปา	C01	7	active	#ERROR!	\N	\N	2026-08-25 00:00:00	2026-09-15 20:05:25.205628
49	139 ถนนนันทาราม ตำบลหายยา อำเภอเมืองเชียงใหม่ เชียงใหม่ 50100	\N	https://maps.app.goo.gl/wvUncHgNEBnJzVL26	#3&Cg5zJ	053200888	WH_49	\N	https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80	18.7747497	98.9824371	ภัตตาคารตูลู่	C03	1	active	ศูนย์เวลเนสประเภทภัตตาคาร (Wellness Restaurant)	\N	\N	2026-08-25 00:00:00	2026-09-15 20:40:53.244788
75	185/3 หมู่ที่- ตรอก/ซอย- ถนน- ตำบลหายยา อำเภอเมืองเชียงใหม่ เชียงใหม่ 50100	\N	https://maps.app.goo.gl/qaMrKMRH9VNjuMB27	C0eYg_l8	\N	WH_75	\N	\N	18.7715681	98.9801778	เอื้องคำสาย อาหารเหนือ	C03	1	ACTIVE	- ศูนย์เวลเนสประเภทภัตตาคาร (Wellness Restaurant) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
202	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B8%97%E0%B8%B3%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%8A%E0%B8%A1%E0%B8%A3%E0%B8%A1%E0%B8%AA%E0%B9%88%E0%B8%87%E0%B9%80%E0%B8%AA%E0%B8%A3%E0%B8%B4%E0%B8%A1%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%97%E0%B9%88%E0%B8%AD%E0%B8%87%E0%B9%80%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B8%A2%E0%B8%A7%E0%B8%9A%E0%B9%89%E0%B8%B2%E0%B8%99%E0%B9%84%E0%B8%A3%E0%B9%88%E0%B8%81%E0%B8%AD%E0%B8%87%E0%B8%82%E0%B8%B4%E0%B8%87+%E0%B8%AB%E0%B8%A1%E0%B8%B9%E0%B9%88+3+%E0%B8%95.%E0%B8%AB%E0%B8%99%E0%B8%AD%E0%B8%87%E0%B8%84%E0%B8%A7%E0%B8%B2%E0%B8%A2+%E0%B8%AD.%E0%B8%AB%E0%B8%B2%E0%B8%87%E0%B8%94%E0%B8%87+%E0%B8%88.%E0%B9%80%E0%B8%8A%E0%B8%B5%E0%B8%A2%E0%B8%87%E0%B9%83%E0%B8%AB%E0%B8%A1%E0%B9%88/@18.7260975,98.8992585,3724m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30da36c54fd3733f:0xeb5c80ac9805c6b8!8m2!3d18.7260978!4d98.9095368!16s%2Fg%2F11b7hhdkmp?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	w$1tkz3P	\N	WH_202	\N	\N	18.7260978	98.9095368	ชมรมส่งเสริมการท่องเที่ยวโดยชุมชนบ้านไร่กองขิงโฮมสเตย์	C05	15	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
13	45 หมู่ที่2 ตรอก/ซอย11 ถนนนิมมานเหมินท์ ตำบลสุเทพ อำเภอเมืองเชียงใหม่ เชียงใหม่ 50200	\N	https://maps.app.goo.gl/kuK3AvMJ4qTMkHA69	oCqWT9*E	\N	WH_13	\N	\N	18.7968282	98.9699695	เกรซเดนทัลแคร์คลินิกทันตกรรม	C02	1	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
4	49 ต.หายยา เมืองเชียงใหม่ 50100	\N	https://maps.app.goo.gl/FwQ3UrUru43QqEpQ6	QxD*Hwg2	0000000000	WH_4		["https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"]	18.7809715	98.9856659	ปัญญาไท คลินิกการแพทย์แผนไทย	C02	1	ACTIVE	["ศูนย์เวลเนสประเภทสปาเพื่อสุขภาพ (Wellness Spa)"]	\N	\N	2026-08-25 00:00:00	\N
195	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B8%A8%E0%B8%B9%E0%B8%99%E0%B8%A2%E0%B9%8C%E0%B8%9A%E0%B8%A3%E0%B8%B4%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%82%E0%B9%89%E0%B8%AD%E0%B8%A1%E0%B8%B9%E0%B8%A5%E0%B8%8A%E0%B8%B8%E0%B8%A1%E0%B8%8A%E0%B8%99%E0%B8%97%E0%B9%88%E0%B8%AD%E0%B8%87%E0%B9%80%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B8%A2%E0%B8%A7%E0%B9%80%E0%B8%8A%E0%B8%B4%E0%B8%87%E0%B8%AA%E0%B8%B8%E0%B8%82%E0%B8%A0%E0%B8%B2%E0%B8%9E+%E0%B8%9A%E0%B9%89%E0%B8%B2%E0%B8%99%E0%B9%81%E0%B8%A1%E0%B9%88%E0%B8%81%E0%B8%B3%E0%B8%9B%E0%B8%AD%E0%B8%87/@18.8641105,99.3422906,3721m/data=!3m1!1e3!4m10!1m2!2m1!1z4LiB4Lil4Li44LmI4Lih4LiX4LmI4Lit4LiH4LmA4LiX4Li14LmI4Lii4Lin4LmC4LiU4Lii4LiK4Li44Lih4LiK4LiZ4LmB4Lih4LmI4LiB4Liz4Lib4Lit4LiH!3m6!1s0x30d98de6f2c38ba7:0x2e828a8830777e65!8m2!3d18.8654966!4d99.3492073!15sCl3guIHguKXguLjguYjguKHguJfguYjguK3guIfguYDguJfguLXguYjguKLguKfguYLguJTguKLguIrguLjguKHguIrguJnguYHguKHguYjguIHguLPguJvguK3guIdaZSJj4LiB4Lil4Li44LmI4LihIOC4l-C5iOC4reC4h-C5gOC4l-C4teC5iOC4ouC4pyDguYLguJTguKIg4LiK4Li44Lih4LiK4LiZIOC5geC4oeC5iCDguIHguLPguJvguK0g4LiHkgEOdmlzaXRvcl9jZW50ZXKaAURDaTlEUVVsUlFVTnZaRU5vZEhsalJqbHZUMmt4YWxrd09VSmxWV042VTJ4S01GVnVaM2xNVldoeVRtdHNOVTFyUlJBQuABAPoBBAg9EEY!16s%2Fg%2F11h9rb7455?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	i0AsDS_8	\N	WH_195	\N	\N	18.8654966	99.3492073	กลุ่มท่องเที่ยวโดยชุมชนแม่กำปอง	C05	23	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
1	78 หมู่ที่6 ตำบลริมใต้ อำเภอแม่ริม เชียงใหม่ 50180	lattana	https://maps.app.goo.gl/YkN2EgXThxsxCU5M6	n4&@pl0R	0123456789	WH_1	นวดสมุนไพร	https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80	18.9118461	98.9312635	ลานตนา มาสสาจ แอนด์ สปา	C01	7	ACTIVE	["ศูนย์เวลเนสประเภทสปาเพื่อสุขภาพ (Wellness Spa)"]	{"monday":{"active":false,"open":"10:00","close":"22:00"},"tuesday":{"active":true,"open":"10:00","close":"22:00"},"wednesday":{"active":true,"open":"10:00","close":"22:00"},"thursday":{"active":true,"open":"10:00","close":"22:00"},"friday":{"active":true,"open":"10:00","close":"22:00"},"saturday":{"active":true,"open":"12:00","close":"15:00"},"sunday":{"active":false,"open":"10:00","close":"22:00"}}	\N	2026-08-25 00:00:00	\N
71	12/2 หมู่ที่8 ถนนแม่ริม-สะเมิง ตำบลแม่แรม อำเภอแม่ริม เชียงใหม่ 50180	test	https://maps.app.goo.gl/Q9VCgQgtZFLdqtKg9	N2SyA$Go	0123456789	WH_71	นวดสปาครบครัน	https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80	18.9557186	98.8641995	ชิดาสปา	C01	7	ACTIVE	- ศูนย์เวลเนสประเภทสปาเพื่อสุขภาพ (Wellness Spa)  - ศูนย์เวลเนสอัตลักษ ณ์ไทย (Thainess Wellness Destination)	{"monday":{"active":true,"open":"09:00","close":"18:00"},"tuesday":{"active":true,"open":"09:00","close":"18:00"},"wednesday":{"active":true,"open":"09:00","close":"18:00"},"thursday":{"active":true,"open":"09:00","close":"18:00"},"friday":{"active":true,"open":"09:00","close":"18:00"},"saturday":{"active":false,"open":"","close":""},"sunday":{"active":false,"open":"","close":""}}	\N	2026-08-25 00:00:00	\N
29	200 ม.4 ต.แม่เหียะ อ.เมืองเชียงใหม่ 50100	\N	https://maps.app.goo.gl/wMbbarXrabA4Qfzt9	Ahs0%OZU	\N	WH_29	\N	\N	18.7837855	99.0062701	เอ็มพีคลินิก	C02	1	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
55	51 หมู่ที่1 ตำบลร้องวัวแดง อำเภอสันกำแพง เชียงใหม่ 50130	\N	https://maps.app.goo.gl/EidPJCb663UygP3NA	s6J@l%e4	\N	WH_55	\N	\N	18.741745	99.223045	บ้านสวนมะยงชิด Café & Restaurant	C03	13	ACTIVE	ศูนย์เวลเนสประเภทภัตตาคาร (Wellness Restaurant)	\N	\N	2026-08-25 00:00:00	\N
181	ไม่ระบุ	\N	#	a&$V4cGe	\N	WH_181	\N	\N	\N	\N	ร้านอาหารสวัสดิการโครงการหลวงอินทนนท์	C03	2	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
104	1 หมู่ที่7 ตำบลบ้านสหกรณ์ อำเภอแม่ออน เชียงใหม่ 50130	\N	https://maps.app.goo.gl/PnzebSwMk7cZbufh8	@Nd52HKp	\N	WH_104	\N	\N	18.8145004	99.2294265	กิจการน้ำพุร้อนสันกำแพง	C04	23	ACTIVE	- ศูนย์เวลเนสประเภทที่พักนักท่อ งเที่ยว (Wellness Accommodation) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
105	1 หมู่ที่6 ถนน เชียงใหม่-ฮอด ตำบลบ้านกลางอำเภอสันป่าตอง เชียงใหม่ 50120	\N	https://maps.app.goo.gl/winmJMNDmbfuSCk17	7yOa_SZc	\N	WH_105	\N	\N	18.5700798	98.8791591	เก๊าไม้ล้านนา รีสอร์ท	C04	12	ACTIVE	- ศูนย์เวลเนสประเภทที่พักนักท่อ งเที่ยว (Wellness Accommodation) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
143	ไม่ระบุ	\N	#	GhDMJ%2$	\N	WH_143	\N	\N	\N	\N	ร้านมุกดา ร้านค้าสวัสดิการ(หลังอาคารสำนักงาน)	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
6	455/1 หมู่ที่3 ตรอก/ซอย- ถนน- ตำบลบ้านกลาง อำเภอสันป่าตอง เชียงใหม่ 50120	\N	https://maps.app.goo.gl/NNBvjm6v7sS8ss7M7	biIFa$2&	0000000000	WH_6	\N	\N	18.5627342	98.8722365	คลินิกการแพทย์แผนไทยและการแพทย์ทางเลือก โรงพยาบาลส่งเสริมสุขภาพบ้านทุ่งเสี้ยว	C02	12	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
198	ไม่ระบุ	\N	http://google.com/maps/place/%E0%B8%8A%E0%B8%B8%E0%B8%A1%E0%B8%8A%E0%B8%99%E0%B8%AD%E0%B8%AD%E0%B8%99%E0%B9%83%E0%B8%95%E0%B9%89+%E0%B8%AB%E0%B8%A1%E0%B8%B9%E0%B9%88%E0%B8%9A%E0%B9%89%E0%B8%B2%E0%B8%99+CIV+%E0%B8%88.%E0%B9%80%E0%B8%8A%E0%B8%B5%E0%B8%A2%E0%B8%87%E0%B9%83%E0%B8%AB%E0%B8%A1%E0%B9%88/@18.7264342,99.0224209,59583m/data=!3m1!1e3!4m10!1m2!2m1!1z4Lin4Li04Liq4Liy4Lir4LiB4Li04LiI4LiK4Li44Lih4LiK4LiZIOC4l-C5iOC4reC4h-C5gOC4l-C4teC5iOC4ouC4p-C4reC4uOC4leC4quC4suC4q-C4geC4o-C4o-C4oeC4quC4o-C5ieC4suC4h-C4quC4o-C4o-C4hOC5jOC4reC4reC4meC5g-C4leC5iQ!3m6!1s0x30d9870a3296cc27:0x511249dcb3239071!8m2!3d18.7370903!4d99.2145336!15sCpQB4Lin4Li04Liq4Liy4Lir4LiB4Li04LiI4LiK4Li44Lih4LiK4LiZIOC4l-C5iOC4reC4h-C5gOC4l-C4teC5iOC4ouC4p-C4reC4uOC4leC4quC4suC4q-C4geC4o-C4o-C4oeC4quC4o-C5ieC4suC4h-C4quC4o-C4o-C4hOC5jOC4reC4reC4meC5g-C4leC5iZIBEnRvdXJpc3RfYXR0cmFjdGlvbuABAA!16s%2Fg%2F11fknpgxcj?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	7U#iDfhX	\N	WH_198	\N	\N	18.7370903	99.2145336	วิสาหกิจชุมชน ท่องเที่ยวอุตสาหกรรมสร้างสรรค์ออนใต้	C05	13	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
87	3.0/10 ถนนเจริญสุข ตำบลช้างเผือก อำเภอเมืองเชียงใหม่ เชียงใหม่ 50300	\N	https://maps.app.goo.gl/dJS8ik56LjYNz1KZA	aC7@y1dX	\N	WH_87	\N	\N	18.8017421	98.9784428	เชียงใหม่ สปา มันตรา	C01	1	ACTIVE	- ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
96	162/5 ถนนพระปกเกล้า ตำบลพระสิงห์ อำเภอเมืองเชียงใหม่ เชียงใหม่ 50200	\N	https://maps.app.goo.gl/RWswrsVKJ3K9XLJ1A	D&cBP@7A	\N	WH_96	\N	\N	18.7875012	98.9881238	ลีลานวดไทย สาขาเจดีย์หลวง	C01	1	ACTIVE	- ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
194	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B8%81%E0%B8%B2%E0%B9%81%E0%B8%9F%E0%B8%A3%E0%B8%B8%E0%B9%88%E0%B8%87%E0%B8%AD%E0%B8%A3%E0%B8%B8%E0%B8%93(%E0%B8%AB%E0%B8%B2%E0%B8%87%E0%B8%94%E0%B8%87-%E0%B9%80%E0%B8%8A%E0%B8%B5%E0%B8%A2%E0%B8%87%E0%B9%83%E0%B8%AB%E0%B8%A1%E0%B9%88)/@18.706764,98.9022949,3724m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30da36ba6c4c6e5b:0x3c14f0b30687ed22!8m2!3d18.7067643!4d98.9125732!16s%2Fg%2F11c5ssz5s_?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	6e%Eg#Gk	\N	WH_194	\N	\N	18.7067643	98.9125732	กาแฟรุ่งอรุณ	C03	15	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
111	ไม่ระบุ	\N	#	wlyu$KD3	\N	WH_111	\N	\N	\N	\N	คำหวาน คูซีน	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
199	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B8%81%E0%B8%A5%E0%B8%B8%E0%B9%88%E0%B8%A1%E0%B8%97%E0%B9%88%E0%B8%AD%E0%B8%87%E0%B9%80%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B8%A2%E0%B8%A7%E0%B9%80%E0%B8%8A%E0%B8%B4%E0%B8%87%E0%B8%AD%E0%B8%99%E0%B8%B8%E0%B8%A3%E0%B8%B1%E0%B8%81%E0%B8%A9%E0%B9%8C%E0%B8%9A%E0%B9%89%E0%B8%B2%E0%B8%99%E0%B8%9B%E0%B8%87-%E0%B8%AB%E0%B9%89%E0%B8%A7%E0%B8%A2%E0%B8%A5%E0%B8%B2%E0%B8%99/@18.7191365,99.191145,3724m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30d987c2d831e321:0x5c034b6b52b4540d!8m2!3d18.7191368!4d99.2014233!16s%2Fg%2F11fmxs_kd6?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	LZo!p&Y2	\N	WH_199	\N	\N	18.7191368	99.2014233	กลุ่มการท่องเที่ยวเชิงอนุรักษ์บ้านปง-ห้วยลาน	C05	13	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
35	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B9%82%E0%B8%A3%E0%B8%87%E0%B8%9E%E0%B8%A2%E0%B8%B2%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B9%80%E0%B8%8A%E0%B8%B5%E0%B8%A2%E0%B8%87%E0%B9%83%E0%B8%AB%E0%B8%A1%E0%B9%88+%E0%B9%80%E0%B8%A1%E0%B8%94%E0%B8%B4%E0%B8%84%E0%B8%AD%E0%B8%A5+%E0%B9%80%E0%B8%8B%E0%B9%87%E0%B8%99%E0%B9%80%E0%B8%95%E0%B8%AD%E0%B8%A3%E0%B9%8C/@18.7803454,98.9779847,3723m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30da307576dfa3f1:0x8c0cae26c2f90b90!8m2!3d18.7803457!4d98.988263!16s%2Fg%2F1v_y9c0c?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	vG5SEcj$	\N	WH_35	\N	\N	18.7803457	98.988263	โรงพยาบาลเชียงใหม่เมดิคอลเซ็นเตอร์	C02	1	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
8	106 หมู่ที่9 ตำบลขัวมุง อำเภอสารภี เชียงใหม่ 50140	\N	https://maps.app.goo.gl/2o4AY65aNgJ15EvT9	19k$vWHX	0000000000	WH_8	\N	\N	18.6644065	98.9862352	ศูนย์แพทย์แผนไทยสารภี (ขัวมุง) แม่แก้วเรือน จิวหานัง อุปถัมภ์	C02	19	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
112	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B8%A8%E0%B8%B9%E0%B8%99%E0%B8%A2%E0%B9%8C%E0%B9%80%E0%B8%A7%E0%B8%8A%E0%B8%A8%E0%B8%B2%E0%B8%AA%E0%B8%95%E0%B8%A3%E0%B9%8C%E0%B8%9C%E0%B8%B9%E0%B9%89%E0%B8%AA%E0%B8%B9%E0%B8%87%E0%B8%AD%E0%B8%B2%E0%B8%A2%E0%B8%B8+%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%A7%E0%B8%B4%E0%B8%97%E0%B8%A2%E0%B8%B2%E0%B8%A5%E0%B8%B1%E0%B8%A2%E0%B9%80%E0%B8%8A%E0%B8%B5%E0%B8%A2%E0%B8%87%E0%B9%83%E0%B8%AB%E0%B8%A1%E0%B9%88/@18.7563099,98.9589382,3723m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30da305f8d4bfccd:0x369219fa40c3d4d5!8m2!3d18.7563102!4d98.9692165!16s%2Fg%2F11bxgn0q00?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	e46bqkO%	\N	WH_112	\N	\N	18.7563102	98.9692165	ศูนย์เวชศาสตร์ผู้สูงอายุ คณะแพทยศาสตร์ มหาวิทยาลัยเชียงใหม่	C02	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
62	129 ตำบลวัดเกต อำเภอเมืองเชียงใหม่ เชียงใหม่ 50000	\N	https://maps.app.goo.gl/Ms6pa9PWHtvhLrYS6	AT%!1iG@	\N	WH_62	\N	\N	18.7836638	99.0053686	เก็ดตะหว๋า นวดแผนไทย 	C01	1	ACTIVE	ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage)	\N	\N	2026-08-25 00:00:00	\N
63	62 หมู่ที่2 ตรอก/ซอย- ถนน- ตำบลออนเหนือ อำเภอแม่ออน เชียงใหม่ 50130	\N	https://maps.app.goo.gl/HaTnx8oDz3RR6THu7	7@A1zJK*	\N	WH_63	\N	\N	18.7981266	99.2436752	ร้านฮักแม่ออน นวดเพื่อสุขภาพ	C01	23	ACTIVE	ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage)	\N	\N	2026-08-25 00:00:00	\N
12	180/1 ต.หายยา เมืองเชียงใหม่ 50100	\N	https://maps.app.goo.gl/HJU1bdXNTCZVbmSg8	N9j15*Ah	\N	WH_12	\N	\N	18.7808319	98.9924908	คลินิกทันตกรรม เดนทัล เวิร์ล	C02	1	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
14	7/2 ต.หายยา เมืองเชียงใหม่ 50100	\N	https://maps.app.goo.gl/kNtSmmzxB5D2Vggt9	IQ$7hnDx	\N	WH_14	\N	\N	18.7810092	98.9871776	กิจจาคลินิกทันตกรรม	C02	1	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
19	1 ถนนสุขเกษม ตำบลป่าตัน อำเภอเมืองเชียงใหม่ เชียงใหม่ 50300	\N	https://maps.app.goo.gl/34CDNb4e8m7k8KmR7	R%X72qwd	\N	WH_19	\N	\N	18.8123878	98.9910114	แผนกทันตกรรมโรงพยาบาลลานนา	C02	1	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
16	95 ม.1 ต.ช้างเผือก เมืองเชียงใหม่ 50300	\N	https://maps.app.goo.gl/Fic5iUHs2fJn9Qbi8	!oUxy2B&	\N	WH_16	\N	\N	18.8063286	98.9588632	คลินิกทันตกรรมคลาสวัน เฮาส์ออฟ เด็นทัล แคร์	C02	1	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
18	10 ถนนสุขเกษม ตำบลสุเทพ อำเภอเมืองเชียงใหม่ เชียงใหม่ 50200	\N	https://maps.app.goo.gl/aJaHNJ8daaEZwd3x8	s*tHUg6D	\N	WH_18	\N	\N	18.7992252	98.9641663	คลินิกทันตกรรมซี ดี เจ	C02	1	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
23	181 ถนนมหิดล ตำบลหายยา อำเภอเมืองเชียงใหม่ เชียงใหม่ 50100	\N	https://maps.app.goo.gl/9Zqn9Mxz4JaWU9937	$J3Bd7jF	\N	WH_23	\N	\N	18.7738684	98.9765496	คลินิกทันตกรรมแกรนด์เดนท์	C02	1	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
20	119/3 ต.สุเทพ เมืองเชียงใหม่ 50200	\N	https://maps.app.goo.gl/YBCh7SwF88Zuhd7J6	l_4hE%vP	\N	WH_20	\N	\N	18.7895274	98.960511	คลินิกทันตกรรมอบอุ่น	C02	1	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
26	224/1 ม.12 ต.หนองควาย หางดง 50230	\N	https://maps.app.goo.gl/kvNbEgDEffmEGfhM8	4ZgD2Hq*	\N	WH_26	\N	\N	18.7407189	98.9369285	คลินิกทันตกรรม เอ็มเพรส	C02	15	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
24	9 ต.สุเทพ เมืองเชียงใหม่ 50300	\N	https://maps.app.goo.gl/uYdtCczWepR3nVtN9	A#38s%pR	\N	WH_24	\N	\N	18.7899087	98.9626143	ไวร์คลับคลินิกทันตกรรม	C02	1	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
25	5/3 ต.วัดเกต เมืองเชียงใหม่ 50000	\N	https://maps.app.goo.gl/wMbbarXrabA4Qfzt9	TIAR$5e4	\N	WH_25	\N	\N	18.7837855	99.0062701	คลินิกทันตกรรมทูธดรีม	C02	1	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
36	316/1 หมู่ที่- ตรอก/ซอย- ถนนเชียงใหม่ - ลำพูน ตำบลวัดเกต อำเภอเมืองเชียงใหม่ เชียงใหม่ 50000	\N	google.com/maps/place/โรงพยาบาลราชเวช+เชียงใหม่/@18.7803454,98.9779847,3723m/data=!3m1!1e3!4m6!3m5!1s0x30da301ac3803597:0x2d700b85c518b291!8m2!3d18.7668981!4d99.0043205!16s%2Fg%2F1tcthxvs?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	c1sYv@6W	\N	WH_36	\N	\N	\N	\N	โรงพยาบาลราชเวช	C02	1	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
17	233/11ต.ช้างคลาน เมืองเชียงใหม่ 50100	\N	https://maps.app.goo.gl/oqQwTijoRUvXLw7Q7	zgN@T_8a	\N	WH_17	\N	\N	18.7679902	98.9832197	ฟอร์จูนคลินิกทันตกรรม	C02	1	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
21	215/2 ห้อง ต.ช้างคลาน เมืองเชียงใหม่ 50100	\N	https://maps.app.goo.gl/CsiwFg6grxEcDQK98	fc@P7#Lx	\N	WH_21	\N	\N	18.7723093	98.9991701	คลินิกทันตกรรมยูนิคอร์น	C02	1	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
175	ไม่ระบุ	\N	#	0qk!hKpC	\N	WH_175	\N	\N	\N	\N	ครัวริมธาร	C03	2	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
119	ไม่ระบุ	\N	#	C&t%Z7Wx	\N	WH_119	\N	\N	\N	\N	Berger King ห้องโถงภายในประเทศชั้น 2	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
120	ไม่ระบุ	\N	#	RlUD5y_i	\N	WH_120	\N	\N	\N	\N	Dairy Queen ห้องโถงภายในประเทศชั้น 1	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
34	158 หมู่ที่10 ตำบลป่าแดด อำเภอเมืองเชียงใหม่ เชียงใหม่ 50100	\N	https://maps.app.goo.gl/kTHdoDGYuXzPWsXDA	VfqjTU8@	\N	WH_34	\N	\N	18.7610372	98.9727409	โรงพยาบาลเชียงใหม่ใกล้หมอ	C02	1	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
33	186/2 ถนนช้างคลาน ตำบลช้างคลาน อำเภอเมืองเชียงใหม่ เชียงใหม่ 50100	\N	https://maps.app.goo.gl/JSskTsSqDAVvTzpK8	UC0aJ_9!	\N	WH_33	\N	\N	18.7730311	98.9983304	โรงพยาบาลเซ็นทรัลเชียงใหม่เมโมเรียล	C02	1	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
40	259 หมู่ที่1 ตรอก/ซอย- ถนน- ตำบลดอยแก้ว อำเภอจอมทอง เชียงใหม่ 50160	\N	https://maps.app.goo.gl/c9MaSP7kpVvbuwGc9	86t$pPnI	\N	WH_40	\N	\N	18.4067753	98.6738638	คลินิกการแพทย์แผนไทยและการแพทย์ทางเลือก โรงพยาบาลจอมทอง	C02	2	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
38	300 หมู่ที่7 ตรอก/ซอย- ถนน- ตำบลสันมหาพน อำเภอแม่แตง เชียงใหม่ 50150	\N	https://maps.app.goo.gl/FpuGGnKJfKcrZ6jeA	52Qap#fA	\N	WH_38	\N	\N	19.1375775	98.9602642	คลินิกการแพทย์แผนไทยและการแพทย์ทางเลือก โรงพยาบาลแม่แตง	C02	6	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
39	131 หมู่ที่3 ถนนโชตนา ตำบลศรีดงเย็น อำเภอไชยปราการ เชียงใหม่ 50320	\N	https://maps.app.goo.gl/b3xQFiMNyPMeJVK99	l4RqLi&$	\N	WH_39	\N	\N	19.7056114	99.1369312	คลินิกการแพทย์แผนไทยและการแพทย์ทางเลือก โรงพยาบาลไชยปราการ	C02	21	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
42	191 หมู่ที่10 ตำบลสะเมิงใต้ อำเภอสะเมิง	\N	https://maps.app.goo.gl/Ntn8ChsCvCVcCQ2t5	%cDAGS9f	\N	WH_42	\N	\N	18.846671	98.732206	คลินิกการแพทย์แผนไทยและการแพทย์ทางเลือก โรงพยาบาลสะเมิง	C02	8	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
41	511 หมู่ที่25 ตำบลดอยหล่อ อำเภอดอยหล่อ เชียงใหม่ 50160	\N	https://maps.app.goo.gl/2kHB3u8Rpco2CG6S9	@Sau835P	\N	WH_41	\N	\N	18.4777964	98.7805779	คลินิกการแพทย์แผนไทยและการแพทย์ทางเลือก โรงพยาบาลดอยหล่อ	C02	24	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
43	129 หมู่ที่1 ตำบลบวกค้าง อำเภอสันกำแพง เชียงใหม่ 50130	\N	https://maps.app.goo.gl/C2tPnQcmfuSLKy9b7	kYa9%@n1	\N	WH_43	\N	\N	18.7157406	99.1227756	คลินิกแพทย์แผนไทยและแพทย์ทางเลือก โรงพยาบาลสันกำแพง	C02	13	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
45	149 หมู่ที่15 ตำบลยุหว่า อำเภอสันป่าตอง เชียงใหม่ 50120	\N	https://maps.app.goo.gl/zNy8fp8baJ4QTZqaA	_eMlXR3%	\N	WH_45	\N	\N	18.5956136	98.8853212	คลินิกการแพทย์แผนไทยและการแพทย์ทางเลือก โรงพยาบาลสันป่าตอง	C02	12	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
46	294 หมู่ที่10 ตำบลหางดง อำเภอฮอด เชียงใหม่ 50240	\N	https://maps.app.goo.gl/6Lakv85twx3L6dCx7	7l@pCqAy	\N	WH_46	\N	\N	18.1789422	98.6117638	คลินิกการแพทย์แผนไทยและการแพทย์ทางเลือก โรงพยาบาลฮอด	C02	16	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
47	555 หมู่ที่1 ถนนเลี่ยงเมืองเชียงดาว ตำบลเชียงดาว อำเภอเชียงดาว เชียงใหม่ 10270	\N	https://maps.app.goo.gl/EF9Yn9cdygS2zi7p9	JQ_PvXn2	\N	WH_47	\N	\N	19.403235	98.9629758	เชียงดาวคอฟฟี่ แอนด์ ที คาเฟ่	C03	4	ACTIVE	ศูนย์เวลเนสประเภทภัตตาคาร (Wellness Restaurant)	\N	\N	2026-08-25 00:00:00	\N
57	433 หมู่ที่ 15 ถนนโชตนา ตำบลเชียงดาว อำเภอเชียงดาว เชียงใหม่ 10270	\N	https://maps.app.goo.gl/H6SATfHCL4e9VUPF8	b7A$sVv#	\N	WH_57	\N	\N	\N	\N	ดอกเอื้อง นวดเพื่อสุขภาพ	C01	4	ACTIVE	ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage)	\N	\N	2026-08-25 00:00:00	\N
50	6 ตรอก/ซอยJaansap ถนนHuaykeaw ตำบลช้างเผือก อำเภอเมืองเชียงใหม่ เชียงใหม่ 50300	\N	https://maps.app.goo.gl/SdyqA63HAzAuDojz5	82&d!xKB	\N	WH_50	\N	\N	18.8014847	98.9697785	Redbox Chiang Mai	C03	1	ACTIVE	ศูนย์เวลเนสประเภทภัตตาคาร (Wellness Restaurant)	\N	\N	2026-08-25 00:00:00	\N
52	284 หมู่ที่ 3 ตรอก/ซอย- ถนนโชตนา ตำบลดอนแก้ว อำเภอแม่ริม เชียงใหม่ 50180	\N	https://maps.app.goo.gl/TDZkc1rYoSyHbqUa9	D7LqjH&N	\N	WH_52	\N	\N	18.8629242	98.9743109	เดอะ การ์เด้นวิลล์ เทอเรส	C03	7	ACTIVE	ศูนย์เวลเนสประเภทภัตตาคาร (Wellness Restaurant)	\N	\N	2026-08-25 00:00:00	\N
53	99 หมู่ที่5 ตรอก/ซอย- ถนน- ตำบลห้วยแก้ว อำเภอแม่ออน เชียงใหม่ 50130	\N	https://maps.app.goo.gl/3ByU9KkACodNA4ts7	$yeYr0gU	\N	WH_53	\N	\N	18.8671291	99.3225526	ร้านโครงการหลวงตีนตก	C03	23	ACTIVE	ศูนย์เวลเนสประเภทภัตตาคาร (Wellness Restaurant)	\N	\N	2026-08-25 00:00:00	\N
118	ไม่ระบุ	\N	#	w$E3z5*Y	\N	WH_118	\N	\N	\N	\N	ข้าวซอยเฮ้าส์ ห้องโถงภายในประเทศชั้น 1	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
54	99/1-3 หมู่ที่8 ตำบลห้วยแก้ว อำเภอแม่ออน เชียงใหม่ 50130	\N	https://maps.app.goo.gl/aYSh8pjkJhcHf1r2A	6r7UZ1@j	\N	WH_54	\N	\N	18.867423	99.30756	ธารทองลอดจ์	C03	23	ACTIVE	ศูนย์เวลเนสประเภทภัตตาคาร (Wellness Restaurant)	\N	\N	2026-08-25 00:00:00	\N
60	5/1 ตำบลวัดเกต อำเภอเมืองเชียงใหม่ เชียงใหม่ 50000	\N	https://maps.app.goo.gl/wdocqGUefxcuyF6h8	Gg0ACVB*	\N	WH_60	\N	\N	18.7837603	99.0061263	เก็ดตะหว๋า นวดแผนไทย สาขาริมปิง	C01	1	ACTIVE	ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage)	\N	\N	2026-08-25 00:00:00	\N
56	161/1 หมู่ที่3 ตรอก/ซอย- ถนน- ตำบลสันกลาง อำเภอสันกำแพง เชียงใหม่ 50130	\N	https://maps.app.goo.gl/s45eKA81fBFbTt16A	2guhB_5k	\N	WH_56	\N	\N	18.7789094	99.0470754	บ้านนา Barn Na Organic Farm and Halal Food	C03	13	ACTIVE	ศูนย์เวลเนสประเภทภัตตาคาร (Wellness Restaurant)	\N	\N	2026-08-25 00:00:00	\N
59	16/2 ตำบลศรีภูมิ อำเภอเมืองเชียงใหม่ เชียงใหม่ 50200	\N	https://maps.app.goo.gl/DddYgHHoKtGVaNSW7	#xFgJpK8	\N	WH_59	\N	\N	18.7895469	98.9795099	เก็ดตะหว๋า นวดแผนไทย สาขาพระสิงห์	C01	1	ACTIVE	ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage)	\N	\N	2026-08-25 00:00:00	\N
65	358 หมู่ที่10 ถนนสันป่าตอง แม่วาง ตำบลยุหว่า อำเภอสันป่าตอง เชียงใหม่ 50120	\N	https://maps.app.goo.gl/zgXstquKWMr712NA6	$j4arbA5	\N	WH_65	\N	\N	18.624122	98.8943142	ชามา นวดเพื่อสุขภาพ	C01	12	ACTIVE	ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage)	\N	\N	2026-08-25 00:00:00	\N
64	1 หมู่ที่6 ถนนเชียงใหม่-ฮอด ตำบลบ้านกลาง อำเภอสันป่าตอง เชียงใหม่ 50120	\N	https://maps.app.goo.gl/j7VBkUMTsM7wkua5A	s06kM%49	\N	WH_64	\N	\N	18.5700798	98.8791591	ท่ากานสปา	C01	12	ACTIVE	ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage)	\N	\N	2026-08-25 00:00:00	\N
68	100 หมู่ที่7 ถนนแม่ริม- สะเมิง (1096) ตำบลริมใต้ อำเภอแม่ริม เชียงใหม่ 50180	\N	https://maps.app.goo.gl/erQ2wu3wgQS878Ea9	6@XCIiHR	\N	WH_68	\N	\N	18.9206362	98.9292646	อมราวตีเวลเนสเซ็นเตอร์	C04	7	ACTIVE	ศูนย์เวลเนสประเภทที่พักนักท่องเที่ยว (Wellness Accommodation)	\N	\N	2026-08-25 00:00:00	\N
429	ถนนสุเทพ ต.สุเทพ อ.เมือง จ.เชียงใหม่	\N	https://maps.google.com/?q=18.7901,98.9532	N*eO8_4o	\N	WH_429	\N	\N	18.7901	98.9532	ดอยสุเทพ test	C01	1	ACTIVE	ใบอนุญาตประกอบสถานพยาบาล/นวดเพื่อสุขภาพ	\N	\N	2026-08-25 00:00:00	\N
67	188/17 ตำบลสารภี อำเภอสารภี เชียงใหม่ 50140	\N	https://maps.app.goo.gl/t7SCC3wVqqYMaNeH7	uA45HG$8	\N	WH_67	\N	\N	18.7558848	99.0370733	เก็ดตะหว๋า เชียงขาง นวดแผนไทย	C01	19	ACTIVE	ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage)	\N	\N	2026-08-25 00:00:00	\N
66	577 หมู่ที่10 ตำบลยุหว่า อำเภอสันป่าตอง เชียงใหม่50120	\N	https://maps.app.goo.gl/yCmFuFCsydK13Z5ZA	U$s9oWFm	\N	WH_66	\N	\N	\N	\N	สุวรรณา นวดเพื่อสุขภาพ	C01	12	ACTIVE	ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage)	\N	\N	2026-08-25 00:00:00	\N
58	7/4 ตรอก/ซอย9 ถนนนิมมานเหมินทร์ ตำบลสุเทพ อำเภอเมืองเชียงใหม่ เชียงใหม่	\N	https://maps.app.goo.gl/NmpcQHhB1KoFzzqj9	9vM!wt87	\N	WH_58	\N	\N	18.7976993	98.9679415	ฌานตา นวดเพื่อสุขภาพ	C01	1	ACTIVE	ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage)	\N	\N	2026-08-25 00:00:00	\N
76	296 - 298 หมู่ที่- ตรอก/ซอย- ถนนเจริญเมือง ตำบลวัดเกต อำเภอเมืองเชียงใหม่ เชียงใหม่ 50000	\N	https://maps.app.goo.gl/HFyr77sNY6SZZC78A	tIp*TXq7	\N	WH_76	\N	\N	18.7864698	99.0107226	ชีวี เจ & มังสวิรัติ	C03	1	ACTIVE	- ศูนย์เวลเนสประเภทภัตตาคาร (Wellness Restaurant) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
82	84 หมู่ที่8 ตรอก/ซอย- ถนน- ตำบลสารภี อำเภอสารภี เชียงใหม่ 50140	\N	https://maps.app.goo.gl/2LpPVrjoKNu41moAA	DVqIl2y#	\N	WH_82	\N	\N	18.6862061	99.0574389	โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านทุ่งเสี้ยว	C02	19	ACTIVE	- ศูนย์เวลเนสประเภทภัตตาคาร (Wellness Restaurant) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
81	1 หมู่ที่6 ถนนเชียงใหม่-ฮอด ตำบลบ้านกลาง อำเภอสันป่าตอง เชียงใหม่ 50120	\N	https://maps.app.goo.gl/HRPirPtFatVN52d6A	e%7NqCnB	\N	WH_81	\N	\N	18.5688465	98.8797168	พ่อเลี้ยง บิสโทร	C03	12	ACTIVE	- ศูนย์เวลเนสประเภทภัตตาคาร (Wellness Restaurant) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
80	51/3 หมู่ที่1 ตำบลร้องวัวแดง อำเภอสันกำแพง เชียงใหม่ 50130	\N	https://maps.app.goo.gl/DTtspV3vqfX1w6c28	l102M$7x	\N	WH_80	\N	\N	18.7405504	99.2193358	เดอะ โกโก้ ทรี การ์เด้น	C03	13	ACTIVE	- ศูนย์เวลเนสประเภทภัตตาคาร (Wellness Restaurant) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
91	8/1 ถนนราชวิถี ตำบลศรีภูมิ อำเภอเมืองเชียงใหม่ เชียงใหม่ 50300	\N	https://maps.app.goo.gl/mu3Y8vxYjYcofB339	7miZu2%g	\N	WH_91	\N	\N	18.790507	98.992866	ศิรา สปา	C01	1	ACTIVE	- ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
83	15 ตรอก/ซอย3 ถนนนิมมานเหมินทร์ ตำบลสุเทพ อำเภอเมืองเชียงใหม่ เชียงใหม่ 50200	\N	https://maps.app.goo.gl/wRT6HddzjxYvYcx48	Mj2!Ywyx	\N	WH_83	\N	\N	18.7990897	98.9682167	ลานตนา นวดเพื่อสุขภาพ 1	C01	1	ACTIVE	- ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
84	26/5 หมู่ที่- ตรอก/ซอย5 ถนนนิมมานเหมินท์ ตำบลสุเทพ อำเภอเมืองเชียงใหม่ เชียงใหม่ 50200	\N	https://maps.app.goo.gl/UffY79rqJusD4Eqn9	zR0$Gx8N	\N	WH_84	\N	\N	18.7982897	98.9703789	เดอะ เจนเทิล มาสสาจ แอนด์ สปา	C01	1	ACTIVE	- ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
85	67 ตรอก/ซอย3 ถนนท่าแพ ตำบลช้างคลาน อำเภอเมืองเชียงใหม่ เชียงใหม่ 50100	\N	https://maps.app.goo.gl/TPCB5So2VfoS6A9UA	9vAO$Rxu	\N	WH_85	\N	\N	18.7856445	98.9962382	บ้านท่าแพนวดไทย นวดเพื่อสุขภาพ	C01	1	ACTIVE	- ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
77	79/3 ถนนศิริธร ตำบลช้างเผือก อำเภอเมืองเชียงใหม่ เชียงใหม่ 50300	\N	https://maps.app.goo.gl/cRqzD9Chq4jvyRte6	eD5r!73o	\N	WH_77	\N	\N	18.8079522	98.9747243	เรือนคำอิน	C03	1	ACTIVE	- ศูนย์เวลเนสประเภทภัตตาคาร (Wellness Restaurant) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
72	197/2 หมู่ที่1 ตำบลโป่งแยง อำเภอแม่ริม เชียงใหม่ 50180	\N	https://maps.app.goo.gl/jX8U2h4RfGDKQeKh9	Mg_TE87W	\N	WH_72	\N	\N	18.8793597	98.8139964	ปานวิมาน เชียงใหม่ สปา รีสอร์ท	C01	7	ACTIVE	- ศูนย์เวลเนสประเภทสปาเพื่อสุขภาพ (Wellness Spa)  - ศูนย์เวลเนสอัตลักษ ณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
98	14 ตำบลหายยา อำเภอเมืองเชียงใหม่ เชียงใหม่ 50100	\N	https://maps.app.goo.gl/35M15xKJz6ExMZhV9	q3lC$ON5	\N	WH_98	\N	\N	18.7764278	98.9883132	แอนทีค มาสสาจ เชียงใหม่	C01	1	ACTIVE	- ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage)	\N	\N	2026-08-25 00:00:00	\N
97	1 ถนนอินทวโรรส ตำบลศรีภูมิ อำเภอเมืองเชียงใหม่ เชียงใหม่ 50200	\N	https://maps.app.goo.gl/SMRexwxTBpPWx3Y77	crU_4iq%	\N	WH_97	\N	\N	18.7897279	98.987713	ลีลานวดไทย 	C01	1	ACTIVE	- ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
100	41/6 ตรอก/ซอย6 ถนนลอยเคราะห์ ตำบลช้างคลาน อำเภอเมืองเชียงใหม่ เชียงใหม่ 50100	\N	https://maps.app.goo.gl/5c7a6ke9BXUHmiXX8	2Wf!kQh5	\N	WH_100	\N	\N	18.7829225	99.0017763	ซี เอ็ม ไนท์บาซาร์ บูทีค	C04	1	ACTIVE	- ศูนย์เวลเนสประเภทที่พักนักท่อ งเที่ยว (Wellness Accommodation) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
142	ไม่ระบุ	\N	#	#IyO2qxr	\N	WH_142	\N	\N	\N	\N	ร้านมะลิวัลย์ ร้านค้าสวัสดิการ(หลังอาคารสำนักงาน)	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
95	4/1 ถนนราชวิถี ตำบลพระสิงห์ อำเภอเมืองเชียงใหม่ เชียงใหม่ 50200	\N	https://maps.app.goo.gl/g1kekvRbf8CiFUqz7	CQO*J4b#	\N	WH_95	\N	\N	18.790508	98.993111	ลีลานวดไทย สาขาราชวิถี	C01	1	ACTIVE	- ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
90	57,57/1 ถนนจ่าบ้าน ตำบลศรีภูมิ อำเภอเมืองเชียงใหม่ เชียงใหม่ 50300	\N	https://maps.app.goo.gl/7EfAKP6ij2joYYA7A	#YXCZiV4	\N	WH_90	\N	\N	18.7929203	98.9860455	ฟ้าลานนา สปา	C01	1	ACTIVE	- ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
89	96/2 ถนนราชเชียงแสน ตำบลหายยา อำเภอเมืองเชียงใหม่ เชียงใหม่ 50100	\N	https://maps.app.goo.gl/oS1YHDdymiXSqN1u7	wF8J%Ip4	\N	WH_89	\N	\N	18.7809251	98.9900254	ลานนาคำสปา	C01	1	ACTIVE	- ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
107	ไม่ระบุ	\N	#	t54ATd@B	\N	WH_107	\N	\N	\N	\N	ร้านอาหาร Chom Cafe and Restaurant	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
108	ไม่ระบุ	\N	#	PJ*3pLD6	\N	WH_108	\N	\N	\N	\N	ร้านอาหารแสนคำเทอร์เรส	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
109	ไม่ระบุ	\N	#	2JxhOa#T	\N	WH_109	\N	\N	\N	\N	ร้านอาหารกาแล เชียงใหม่	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
88	14 ถนนเจริญราษฎร์ ตำบลวัดเกต อำเภอเมืองเชียงใหม่ เชียงใหม่ 50000	\N	https://maps.app.goo.gl/5xD5LQqQqr4YDrjg7	Lnf*O@4#	\N	WH_88	\N	\N	18.7898564	99.0044074	ระรินจินดา เวลเนส สปา	C01	1	ACTIVE	- ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
136	ไม่ระบุ	\N	#	Nz*@8p_G	\N	WH_136	\N	\N	\N	\N	Thai Royal Orchild Lounge ขาออกภายในประเทศชั้น 2	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
103	369/1 ถนนเจริญราษฏร์ ตำบลวัดเกต อำเภอเมืองเชียงใหม่ เชียงใหม่ 50000	\N	https://maps.app.goo.gl/3bYswea6HGMjwPAV9	tB0LM#X2	\N	WH_103	\N	\N	18.8016707	99.0051174	ครอสเชียงใหม่ ริเวอร์ไซด์	C04	1	ACTIVE	- ศูนย์เวลเนสประเภทที่พักนักท่อ งเที่ยว (Wellness Accommodation) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
113	ไม่ระบุ	\N	https://www.google.com/maps/place/%E0%B9%82%E0%B8%A3%E0%B8%87%E0%B8%9E%E0%B8%A2%E0%B8%B2%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B9%80%E0%B8%8A%E0%B8%B5%E0%B8%A2%E0%B8%87%E0%B9%83%E0%B8%AB%E0%B8%A1%E0%B9%88+%E0%B8%A3%E0%B8%B2%E0%B8%A1/@18.7947971,98.967705,3722m/data=!3m2!1e3!4b1!4m6!3m5!1s0x30da2fe5554fd6d1:0xd8b86ad5b4e32e30!8m2!3d18.7947974!4d98.9779833!16s%2Fg%2F112yfh45s?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	f3#Mc_wJ	\N	WH_113	\N	\N	18.7947974	98.9779833	โรงพยาบาลเชียงใหม่ราม	C02	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
121	ไม่ระบุ	\N	#	CSwi&t2Z	\N	WH_121	\N	\N	\N	\N	Starbucks Coffee ห้องโถงภายในประเทศชั้น 1	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
114	ไม่ระบุ	\N	#	%NgV2DHi	\N	WH_114	\N	\N	\N	\N	ภัตตาคารเจี่ยท้งเฮง สาขาฟ้าฮ่าม	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
122	ไม่ระบุ	\N	#	m$D3G9sR	\N	WH_122	\N	\N	\N	\N	Black canyon coffee ห้องโถงภายในประเทศชั้น 1 (ขาเข้า)	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
123	ไม่ระบุ	\N	#	QkRH8Tf_	\N	WH_123	\N	\N	\N	\N	Black canyon coffee ขาออกระหว่างประเทศชั้น 2 (ในGate)	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
124	ไม่ระบุ	\N	#	T&D9*Zrq	\N	WH_124	\N	\N	\N	\N	Cafe Amezon ห้องโถงภายในประเทศชั้น 1	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
125	ไม่ระบุ	\N	#	4!EUdiYP	\N	WH_125	\N	\N	\N	\N	Wawee Coffee ห้องโถงภายในประเทศชั้น 1	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
126	ไม่ระบุ	\N	#	pQ6#gI!$	\N	WH_126	\N	\N	\N	\N	Mc Donald's ห้องโถงภายในประเทศชั้น 2	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
127	ไม่ระบุ	\N	#	PySU2&6o	\N	WH_127	\N	\N	\N	\N	Thailand yes coffee ห้องโถงภายในประเทศชั้น 2	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
128	ไม่ระบุ	\N	#	2!OU9Ddk	\N	WH_128	\N	\N	\N	\N	กาแฟดอยช้าง ห้องโถงภายในประเทศชั้น 2	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
129	ไม่ระบุ	\N	#	O5#eMEHJ	\N	WH_129	\N	\N	\N	\N	กาแฟดอยช้าง ขาออกภายในประเทศชั้น 2	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
130	ไม่ระบุ	\N	#	z75!@gZJ	\N	WH_130	\N	\N	\N	\N	On ground ขาออกภายในประเทศชั้น 2	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
131	ไม่ระบุ	\N	#	#Bzsy!J9	\N	WH_131	\N	\N	\N	\N	Coral Lounge(The ExcusiveLounge) ขาออกภายในประเทศชั้น 2	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
132	ไม่ระบุ	\N	#	Imta8f#9	\N	WH_132	\N	\N	\N	\N	Coral Lounge(The ExcusiveLounge) ขาออกระหว่างประเทศชั้น 2	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
133	ไม่ระบุ	\N	#	JK0_NAzS	\N	WH_133	\N	\N	\N	\N	Fusion one(PKT Food Service) ขาออกภายในประเทศชั้น 2	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
15	189/24 ถ.บำเพ็ญประโยชน์  ต.ช้างคลาน อ.เมืองเชียงใหม่ 50100	\N	https://maps.app.goo.gl/zPYfdXwfBSXaMy1g8	iDj$F3Pe	\N	WH_15	\N	\N	18.7773727	98.9997721	วิรัช-กอบกุล คลินิกทันตแพทย์	C02	1	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
134	ไม่ระบุ	\N	#	jQA&5nKD	\N	WH_134	\N	\N	\N	\N	Black CanyonCoffee ใกล้ lounge ขาออกภายในประเทศชั้น 2	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
32	147 หมู่ที่4 ตำบลหนองป่าครั่ง อำเภอเมืองเชียงใหม่ เชียงใหม่ 50000	\N	https://maps.app.goo.gl/U7zY7hMzH27sgH2W7	Cez@Qc7p	\N	WH_32	\N	\N	18.797363	99.0249331	โรงพยาบาลทั่วไปขนาดเล็ก เอ็ม ที อินเตอร์เมด	C02	1	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
135	ไม่ระบุ	\N	#	2I0@gk*%	\N	WH_135	\N	\N	\N	\N	ภัตตาคารการบินไทย ห้องโถงภายในประเทศชั้น 2	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
141	ไม่ระบุ	\N	#	P&!j7S0d	\N	WH_141	\N	\N	\N	\N	ร้านภัทร ร้านค้าสวัสดิการ(หลังอาคารสำนักงาน)	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
51	2/2 ตรอก/ซอย13 ถนนนิมมานเหมินทร์ ตำบลสุเทพ อำเภอเมืองเชียงใหม่ เชียงใหม่ 50200	\N	https://maps.app.goo.gl/k6Ba3rFE6ciQn6X29	#JrtoTG6	\N	WH_51	\N	\N	18.7964567	98.9669402	ลานตนา นวดเพื่อสุขภาพ 2	C03	1	ACTIVE	ศูนย์เวลเนสประเภทภัตตาคาร (Wellness Restaurant)	\N	\N	2026-08-25 00:00:00	\N
74	8 ตรอก/ซอยห้วยแก้ว 3ข ถนนห้วยแก้ว ตำบลสุเทพ อำเภอเมืองเชียงใหม่ เชียงใหม่ 50200	\N	https://maps.app.goo.gl/hh9sXEGh7M1KsfWX7	6_DZ4rqp	\N	WH_74	\N	\N	18.8047807	98.9569602	โรงพยาบาลชุมชนตำบลดอนแก้ว	C02	7	ACTIVE	- ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
73	45 ต.ป่าแดด, เมืองเชียงใหม่, 50100	\N	https://maps.app.goo.gl/9cGFDYXKcEiqJtN4A	3!d6Ap@v	\N	WH_73	\N	\N	18.7629108	99.0026321	ศูนย์ส่งเสริมพฤฒพลังผู้สูงอายุ มช.	C02	1	ACTIVE	#ERROR!	\N	\N	2026-08-25 00:00:00	\N
92	98/3 ถนนราชดำเนิน ตำบลพระสิงห์ อำเภอเมืองเชียงใหม่ เชียงใหม่ 50200	\N	https://maps.app.goo.gl/WA7Mo5bVshaDChfdA	H!4Rwrq_	\N	WH_92	\N	\N	18.788528	98.983603	ลีลานวดไทย สาขาพระสิงห์	C01	1	ACTIVE	- ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
110	ไม่ระบุ	\N	#	v3Ij#Z&x	\N	WH_110	\N	\N	\N	\N	ร้านอาหาร At ขัวเหล็ก	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
117	ไม่ระบุ	\N	#	tBEGV4#M	\N	WH_117	\N	\N	\N	\N	ร้านอาหาร The  View Village	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
146	ไม่ระบุ	\N	#	Aa!Cf&S6	\N	WH_146	\N	\N	\N	\N	Potato Conner ห้องโถงภายในประเทศชั้น1	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
196	ไม่ระบุ	\N	#	N9gfio@U	\N	WH_196	\N	\N	\N	\N	วิสาหกิจชุมชนกลุ่มท่องเที่ยวโดยชุมชนไตลื้อเมืองหลวงเหนือ	C05	5	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
197	ไม่ระบุ	\N	#	l9DZ5A%f	\N	WH_197	\N	\N	\N	\N	ชุมชนท่องเที่ยวบ้านหนองครก	C05	11	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
203	ไม่ระบุ	\N	#	43C*!zWF	\N	WH_203	\N	\N	\N	\N	คลินิกทันตกรรม วายแอนด์บี	C02	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
137	ไม่ระบุ	\N	#	T6nwp$Oc	\N	WH_137	\N	\N	\N	\N	Thai Royal Orchild Lounge ขาออกระหว่างประเทศชั้น 2	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
138	ไม่ระบุ	\N	#	#qwN%kF7	\N	WH_138	\N	\N	\N	\N	Bangkok AirwayLounge ห้องโถงภายในประเทศชั้น 2	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
139	ไม่ระบุ	\N	#	_&1@cAu$	\N	WH_139	\N	\N	\N	\N	CNX Fresh Fruit ร้านค้าสวัสดิการ(หลังอาคารสำนักงาน)	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
140	ไม่ระบุ	\N	#	@GBu1#3a	\N	WH_140	\N	\N	\N	\N	Coffee Bike ร้านค้าสวัสดิการ(หลังอาคารสำนักงาน)	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
102	296 - 298 หมู่ที่- ตรอก/ซอย- ถนนเจริญเมือง ตำบลวัดเกต อำเภอเมืองเชียงใหม่	\N	https://maps.app.goo.gl/zNn3JNsaHAHBXjFH8	&XBtM9g!	\N	WH_102	\N	\N	18.7864698	99.0107226	ชีวีวนา บูติค โฮเทล	C04	1	ACTIVE	- ศูนย์เวลเนสประเภทที่พักนักท่อ งเที่ยว (Wellness Accommodation) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
115	ไม่ระบุ	\N	#	mGa!3z#t	\N	WH_115	\N	\N	\N	\N	ร้านอาหารสามเสนวิลล่า เชียงใหม่	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
144	ไม่ระบุ	\N	#	%2NjiBx1	\N	WH_144	\N	\N	\N	\N	ร้านครัวแม่จอย ร้านค้าสวัสดิการ(หลังอาคารสำนักงาน)	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
145	ไม่ระบุ	\N	#	K0@PvmI7	\N	WH_145	\N	\N	\N	\N	เบรดฮัท(Bread Hut) ห้องโถงภายในประเทศชั้น2	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
147	ไม่ระบุ	\N	#	OMw5N@*u	\N	WH_147	\N	\N	\N	\N	บจก.ครัวการบินกรุงเทพเชียงใหม่ ตรงข้ามคลังสินค้า	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
148	ไม่ระบุ	\N	#	Vi2Z%f@0	\N	WH_148	\N	\N	\N	\N	Black CanyonCoffee ขาออกภายในประเทศชั้น 2 ใกล้ ดอยช้าง	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
149	ไม่ระบุ	\N	#	mqV&6%_v	\N	WH_149	\N	\N	\N	\N	Black Canyon /Coffee ห้องโถงภายในประเทศชั้น 1 ข้างประตู 5	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
150	ไม่ระบุ	\N	#	Vwcb8$CI	\N	WH_150	\N	\N	\N	\N	Thailand yes coffee ขาออกระหว่างประเทศ ชั้น 2	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
151	ไม่ระบุ	\N	#	BEt14!Mw	\N	WH_151	\N	\N	\N	\N	Dairy Queen ขาออกระหว่างประเทศ ชั้น 2	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
152	ไม่ระบุ	\N	#	xmVq2_3F	\N	WH_152	\N	\N	\N	\N	Berger King ขาออกระหว่างประเทศชั้น 2	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
153	ไม่ระบุ	\N	#	N@l!BGP1	\N	WH_153	\N	\N	\N	\N	Noodle Express โถงระหว่างประเทศชั้น 1	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
154	ไม่ระบุ	\N	#	@Rg83Z#f	\N	WH_154	\N	\N	\N	\N	กาแฟดอยช้าง Busgateภายในประเทศ	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
155	ไม่ระบุ	\N	#	x&r$L4Iu	\N	WH_155	\N	\N	\N	\N	On ground Busgateภายในประเทศ	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
156	ไม่ระบุ	\N	#	5dwk6!SI	\N	WH_156	\N	\N	\N	\N	ร้านเอกทิพย์โชคดี 	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
157	ไม่ระบุ	\N	#	IM%Q58u1	\N	WH_157	\N	\N	\N	\N	โรงแรมศิลป์ 	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
158	ไม่ระบุ	\N	#	4MYcGs9%	\N	WH_158	\N	\N	\N	\N	โรงแรมฮอลิเดย์การ์เด้นท์	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
159	ไม่ระบุ	\N	#	4xEUP*k1	\N	WH_159	\N	\N	\N	\N	โรงแรมไอบิส เชียงใหม่ นิมมาน เจอร์นีย์ ฮับ 	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
160	ไม่ระบุ	\N	#	#VRrOf4J	\N	WH_160	\N	\N	\N	\N	โรงแรมโนโวเทล เชียงใหม่ 	C03	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
161	ไม่ระบุ	\N	#	H8B$Ik#i	\N	WH_161	\N	\N	\N	\N	Terra restaurant (ร้านอาหาร แทร์รา)	C03	7	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
162	ไม่ระบุ	\N	#	sI!D6pG2	\N	WH_162	\N	\N	\N	\N	บจก.คุ้มเสือตระการ	C03	7	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
163	ไม่ระบุ	\N	#	j47wc%An	\N	WH_163	\N	\N	\N	\N	Terra&The Farmers'Bar	C03	7	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
165	ไม่ระบุ	\N	#	MaEs1C!i	\N	WH_165	\N	\N	\N	\N	ร้านแม่กลางชวนชิม	C03	2	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
166	ไม่ระบุ	\N	#	E70#8h*K	\N	WH_166	\N	\N	\N	\N	ร้านคนเหนือ	C03	2	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
167	ไม่ระบุ	\N	#	2ZMql$1x	\N	WH_167	\N	\N	\N	\N	ร้านจ๋าเหนือแซบเวอร์	C03	2	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
168	ไม่ระบุ	\N	#	Hqc!W7bC	\N	WH_168	\N	\N	\N	\N	นางสาวจุรีรัตน์ ยศบุญยืน	C03	2	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
169	ไม่ระบุ	\N	#	*lI!U92S	\N	WH_169	\N	\N	\N	\N	ร้านมีข้าว-มีปลา	C03	2	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
170	ไม่ระบุ	\N	#	EkmJl7_n	\N	WH_170	\N	\N	\N	\N	ร้านน้ำตกแม่กลาง	C03	2	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
172	ไม่ระบุ	\N	#	2d%4#Ou7	\N	WH_172	\N	\N	\N	\N	ครัวรวิพรรณ์	C03	2	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
173	ไม่ระบุ	\N	#	VT72C$Qa	\N	WH_173	\N	\N	\N	\N	ครัวรุ่งอรุณ	C03	2	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
174	ไม่ระบุ	\N	#	%Zc9UNLp	\N	WH_174	\N	\N	\N	\N	ครัวอินทนนท์	C03	2	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
176	ไม่ระบุ	\N	#	$3W@V&xn	\N	WH_176	\N	\N	\N	\N	ครัวร่มโพธิ์	C03	2	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
177	ไม่ระบุ	\N	#	3iI*PMTU	\N	WH_177	\N	\N	\N	\N	ครัวกัลยกร	C03	2	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
179	ไม่ระบุ	\N	#	%sB5zitM	\N	WH_179	\N	\N	\N	\N	อินทนนท์ไฮแลนด์	C03	2	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
180	ไม่ระบุ	\N	#	woniJ6*3	\N	WH_180	\N	\N	\N	\N	ร้านรุ่งอาหารตามสั่ง	C03	2	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
182	ไม่ระบุ	\N	#	7U4o@xBi	\N	WH_182	\N	\N	\N	\N	ร้าน Celapot Café x Gallery	C03	5	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
183	ไม่ระบุ	\N	#	G6%Bq3Wc	\N	WH_183	\N	\N	\N	\N	ร้านไส้อั่ว ป้าตุ๋ย	C03	24	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
184	ไม่ระบุ	\N	#	ZOfRcI2@	\N	WH_184	\N	\N	\N	\N	ต๊ะต่อนยอน Eatery & cafe	C03	24	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
185	ไม่ระบุ	\N	#	j6wO@D&k	\N	WH_185	\N	\N	\N	\N	ร้านอาหารโอ้กะจู๋ สาขาสันทราย	C03	14	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
186	ไม่ระบุ	\N	#	WbmtHi9!	\N	WH_186	\N	\N	\N	\N	ข้าวชอยป่าแดด	C03	12	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
187	ไม่ระบุ	\N	#	q6eIiu#@	\N	WH_187	\N	\N	\N	\N	ร้านชื่นฤไท คาเฟ่	C03	12	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
188	ไม่ระบุ	\N	#	_1gTZBdN	\N	WH_188	\N	\N	\N	\N	ห้องอาหารคำม่อน	C03	19	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
189	ไม่ระบุ	\N	#	OU@7z432	\N	WH_189	\N	\N	\N	\N	ร้าน TOP - COFFEE & BEER	C03	19	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
190	ไม่ระบุ	\N	#	nhTF_1*u	\N	WH_190	\N	\N	\N	\N	คำม่อน ล้านนา (โรงแรม)	C03	19	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
191	ไม่ระบุ	\N	#	EQG567h&	\N	WH_191	\N	\N	\N	\N	ร้านอาหารบ้านต้นสน "อาหารโบราณ ตำนานแม่"	C03	19	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
192	ไม่ระบุ	\N	#	Ig&2#RbX	\N	WH_192	\N	\N	\N	\N	คำม่อน ล้านนา รีสอร์ท เชียงใหม่	C03	19	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
193	ไม่ระบุ	\N	#	hs_X0oK9	\N	WH_193	\N	\N	\N	\N	BUNGA	C03	15	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
44	201 หมู่ที่11 ตำบลหนองหาร อำเภอสันทราย เชียงใหม่ 50290	\N	https://maps.app.goo.gl/2rVmHjxGuupeucwt9	1s_IgcXd	\N	WH_44	\N	\N	18.920876	98.9941267	คลินิกการแพทย์แผนไทยและการแพทย์ทางเลือก โรงพยาบาลสันทราย	C02	14	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
61	9/3 ตำบลวัดเกต อำเภอเมืองเชียงใหม่ เชียงใหม่ 50000	\N	https://maps.app.goo.gl/Xqtt1YYe4Vu9LXMR6	!kY3GZb@	\N	WH_61	\N	\N	18.7845626	99.0126116	เก็ดตะหว๋า นวดแผนไทย สาขาเจริญเมือง	C01	1	ACTIVE	ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage)	\N	\N	2026-08-25 00:00:00	\N
5	75 หมู่ที่1 ตำบลบ้านสหกรณ์ อำเภอแม่ออน เชียงใหม่ 50130	\N	https://maps.app.goo.gl/U3qZWuTU6p1TKuTn6	G@#&Utv9	0000000000	WH_5	\N	\N	18.7435763	99.2219965	คลินิกการแพทย์แผนไทยและแพทย์ทางเลือก รพ.แม่ออน	C02	23	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
37	11 หมู่ที่9 ตรอก/ซอย- ถนน- ตำบลช่างเคิ่ง อำเภอแม่แจ่ม เชียงใหม่ 50270	\N	https://maps.app.goo.gl/msaEsMCG5XJEEX7r5	6IcdYs0!	\N	WH_37	\N	\N	18.4980395	98.3793057	คลินิกการแพทย์แผนไทยและการแพทย์ทางเลือก โรงพยาบาลเทพรัตนเวชชานุกูลฯ	C02	3	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
93	86-88 ถนนราชดำเนิน ตำบลพระสิงห์ อำเภอเมืองเชียงใหม่ เชียงใหม่ 50200	\N	https://maps.app.goo.gl/awmBc1nH8owrpC7j7	4W7Hje@*	\N	WH_93	\N	\N	18.788391	98.986398	ลีลานวดไทย สาขาราชดำเนิน	C01	1	ACTIVE	- ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage) - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	\N	\N	2026-08-25 00:00:00	\N
10	10 ต. สุเทพ เมืองเชียงใหม่ 50200	\N	https://maps.app.goo.gl/gRQyVgyNH7kKQBjT6	4XQ$v9q@	\N	WH_10	\N	\N	18.7902223	98.9644752	คลินิกทันตกรรมเฉพาะทางนอกเวลาราชการสำนักงานสาธารณสุขจังหวัดเชียงใหม	C02	1	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
27	7/3 ถนนประชาอุทิศ ตำบลช้างเผือก อำเภอเมืองเชียงใหม่ เชียงใหม่ 50300	\N	https://maps.app.goo.gl/zwWVksbVdNpQ2x3FA	oLS*2E!h	\N	WH_27	\N	\N	18.8066875	98.9844836	สหคลินิกเชตวันเชียงใหม่	C02	1	ACTIVE	ศูนย์เวลเนสประเภทสถานพยาบาล (Wellness Clinic)	\N	\N	2026-08-25 00:00:00	\N
2	1 ถนนถนนสุขเกษม ตำบลป่าตัน อำเภอเมืองเชียงใหม่ เชียงใหม่ 50300	\N	https://maps.app.goo.gl/ZUBsn5pfU4uKZS2v5	#l4NinuG	0000000000	WH_2		https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80	\N	\N	ศูนย์ตรวจสุขภาพ โรงพยาบาลลานนา	C02	1	ACTIVE	\N	{"monday":{"active":true,"open":"00:00","close":"23:59"},"tuesday":{"active":true,"open":"00:00","close":"23:59"},"wednesday":{"active":true,"open":"00:00","close":"23:59"},"thursday":{"active":true,"open":"00:00","close":"23:59"},"friday":{"active":true,"open":"00:00","close":"23:59"},"saturday":{"active":true,"open":"00:00","close":"23:59"},"sunday":{"active":true,"open":"00:00","close":"23:59"}}	["https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"]	2026-08-25 00:00:00	2026-09-02 23:38:10.131999
9	89/8 ถนนช้างคลาน ตำบลช้างคลาน อำเภอเมืองเชียงใหม่ เชียงใหม่ 50100	\N	https://maps.app.goo.gl/PTvvYyvwa8HpkZVT7	vc2ibG@4	0000000000	WH_9	\N	\N	18.7784588	99.0001928	ธิดาคลีนิคเวชกรรม	C02	1	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
7	202 หมู่ที่2 ตำบลชมภู อำเภอสารภี เชียงใหม่ 50140	\N	https://maps.app.goo.gl/w7BfdZPuPFg8enFX9	@Zm2$kjE	0000000000	WH_7	\N	\N	18.7077678	99.0620188	รพ.สารภีบวรพัฒนา (ครูบาน้อย เตชะ ปัญโญ อุปถัมภ์) สังกัดรพ.สารภี 	C02	19	ACTIVE	\N	\N	\N	2026-08-25 00:00:00	\N
94	31-33 ถนนราชดำเนิน ตำบลพระสิงห์ อำเภอเมืองเชียงใหม่ เชียงใหม่ 50200	@test2248	https://maps.app.goo.gl/MmGczE1bwzSWmqVT6	Vx2#gSY4	0931431951	WH_94	นวดเพื่อสุขภาพ ผ่อนคลายสบายใจ	https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80	18.7877555	98.9924697	ลีลานวดไทย สาขาท่าแพ	C01	1	ACTIVE	- ศูนย์เวลเนสประเภทนวดเพื่อสุขภาพ (Wellness Massage), - ศูนย์เวลเนสอัตลักษณ์ไทย (Thainess Wellness Destination)	{"monday":{"active":true,"open":"09:00","close":"18:00"},"tuesday":{"active":true,"open":"09:00","close":"18:00"},"wednesday":{"active":true,"open":"09:00","close":"18:00"},"thursday":{"active":true,"open":"09:00","close":"18:00"},"friday":{"active":true,"open":"09:00","close":"18:00"},"saturday":{"active":false,"open":"","close":""},"sunday":{"active":false,"open":"","close":""}}	["https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"]	2026-08-25 00:00:00	2026-09-13 19:08:14.040712
200	บวกค้าง ตำบล บวกค้าง อำเภอสันกำแพง เชียงใหม่ 50130	\N	https://www.google.com/maps/place/%E0%B8%8A%E0%B8%B8%E0%B8%A1%E0%B8%8A%E0%B8%99%E0%B8%97%E0%B9%88%E0%B8%AD%E0%B8%87%E0%B9%80%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B8%A2%E0%B8%A7%E0%B9%82%E0%B8%AD%E0%B8%A1%E0%B8%AD%E0%B8%9B%E0%B8%99%E0%B8%A7%E0%B8%B1%E0%B8%95%E0%B8%A7%E0%B8%B4%E0%B8%96%E0%B9%88%E0%B8%B5%E0%B8%9A%E0%B9%89%E0%B8%B2%E0%B8%99%E0%B8%9B%E0%B9%88%E0%B8%B2%E0%B8%95%E0%B8%B2%E0%B8%A5/@18.7204673,99.0946779,3724m/data=!3m1!1e3!4m10!1m2!2m1!1z4LiK4Li44Lih4LiK4LiZ4LmE4LiX4Lii4Lii4Lit4LiHIOC4muC5ieC4suC4meC4m-C5iOC4suC4leC4suC4pQ!3m6!1s0x30da290001068063:0x23ba1746555553db!8m2!3d18.7199154!4d99.1056949!15sCkDguIrguLjguKHguIrguJnguYTguJfguKLguKLguK3guIcg4Lia4LmJ4Liy4LiZ4Lib4LmI4Liy4LiV4Liy4LilkgEQY29tbXVuaXR5X2NlbnRlcuABAA!16s%2Fg%2F11xvqk5k8p?entry=ttu&g_ep=EgoyMDI2MDcyOC4wIKXMDSoASAFQAw%3D%3D	X@Wvz6Cu	\N	WH_200	\N	https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80	18.7204673	99.0946779	ชุมชนไทยยอง บ้านป่าตาล	C05	13	active	\N	\N	\N	2026-08-25 00:00:00	2026-09-15 20:22:17.455568
116	ไม่ระบุ	\N	#	Jg9a&1*y	\N	WH_116	\N	\N	\N	\N	ภัตตาคารตูลู่ เก่า	C03	1	inactive	\N	\N	\N	2026-08-25 00:00:00	2026-09-15 21:04:40.375579
201	188/17 ตำบลสารภี อำเภอสารภี เชียงใหม่ 50140	\N	#	Jt*PkA29	\N	WH_201	\N	\N	\N	\N	เก็ดตะหว๋า เชียงขาง นวดแผนไทยเก่า	C01	19	inactive	\N	\N	\N	2026-08-25 00:00:00	2026-09-15 21:33:55.025165
106	ไม่ระบุ	\N	https://www.google.com/maps/place/Ohkajhu+Nim+City/@18.772454,98.9757288,17z/data=!3m1!4b1!4m6!3m5!1s0x30da307af728170d:0xdde22a2cf4d19ab7!8m2!3d18.772454!4d98.9783037!16s%2Fg%2F11bw46yxzv?entry=ttu&g_ep=EgoyMDI2MTAyOC4wIKXMDSoASAFQAw%3D%3D	HtG%W2sM	\N	WH_106	\N	\N	18.772454	98.9783037	ร้านอาหารสวนผักโอ้กะจู๋สาขา 2 นิ่มซิตี้เดลี่	C03	1	active	\N	\N	\N	2026-08-25 00:00:00	2026-11-01 22:13:35.165559
\.


--
-- Name: account_requests_request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.account_requests_request_id_seq', 1, true);


--
-- Name: article_article_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.article_article_id_seq', 10, true);


--
-- Name: main_route_details_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.main_route_details_id_seq', 344, true);


--
-- Name: main_routes_route_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.main_routes_route_id_seq', 14, true);


--
-- Name: member_member_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.member_member_id_seq', 7, true);


--
-- Name: my_travel_trip_travel_trip_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.my_travel_trip_travel_trip_id_seq', 12, true);


--
-- Name: notification_notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notification_notification_id_seq', 1, true);


--
-- Name: official_articles_article_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.official_articles_article_id_seq', 17, true);


--
-- Name: operating_hours_oph_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.operating_hours_oph_id_seq', 1, false);


--
-- Name: account_requests account_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_requests
    ADD CONSTRAINT account_requests_pkey PRIMARY KEY (request_id);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (username);


--
-- Name: article article_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article
    ADD CONSTRAINT article_pkey PRIMARY KEY (article_id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (category_id);


--
-- Name: districts districts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.districts
    ADD CONSTRAINT districts_pkey PRIMARY KEY (district_id);


--
-- Name: emergency_services emergency_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_services
    ADD CONSTRAINT emergency_services_pkey PRIMARY KEY (license_id);


--
-- Name: main_route_categories main_route_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.main_route_categories
    ADD CONSTRAINT main_route_categories_pkey PRIMARY KEY (route_id, category_id);


--
-- Name: main_route_details main_route_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.main_route_details
    ADD CONSTRAINT main_route_details_pkey PRIMARY KEY (id);


--
-- Name: main_routes main_routes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.main_routes
    ADD CONSTRAINT main_routes_pkey PRIMARY KEY (route_id);


--
-- Name: member member_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_pkey PRIMARY KEY (member_id);


--
-- Name: my_travel_trip_detail my_travel_trip_detail_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.my_travel_trip_detail
    ADD CONSTRAINT my_travel_trip_detail_pkey PRIMARY KEY (travel_trip_id, license_id);


--
-- Name: my_travel_trip my_travel_trip_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.my_travel_trip
    ADD CONSTRAINT my_travel_trip_pkey PRIMARY KEY (travel_trip_id);


--
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (notification_id);


--
-- Name: official_articles official_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.official_articles
    ADD CONSTRAINT official_articles_pkey PRIMARY KEY (article_id);


--
-- Name: operating_hours operating_hours_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operating_hours
    ADD CONSTRAINT operating_hours_pkey PRIMARY KEY (oph_id);


--
-- Name: wellness_hubs wellness_hubs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_hubs
    ADD CONSTRAINT wellness_hubs_pkey PRIMARY KEY (license_id);


--
-- Name: idx_account_requests_license_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_account_requests_license_status ON public.account_requests USING btree (license_id, request_status);


--
-- Name: idx_account_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_account_requests_status ON public.account_requests USING btree (request_status);


--
-- Name: idx_account_requests_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_account_requests_username ON public.account_requests USING btree (username);


--
-- Name: idx_emergency_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_emergency_category ON public.emergency_services USING btree (category_id);


--
-- Name: idx_emergency_district; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_emergency_district ON public.emergency_services USING btree (district_id);


--
-- Name: idx_emergency_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_emergency_name ON public.emergency_services USING btree (wellness_hub_name);


--
-- Name: idx_emergency_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_emergency_status ON public.emergency_services USING btree (status);


--
-- Name: idx_notification_request_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_request_id ON public.notification USING btree (request_id);


--
-- Name: idx_notification_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_status ON public.notification USING btree (notification_status);


--
-- Name: idx_official_articles_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_official_articles_category ON public.official_articles USING btree (article_category);


--
-- Name: idx_official_articles_publish_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_official_articles_publish_date ON public.official_articles USING btree (publish_date);


--
-- Name: idx_wellness_hubs_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wellness_hubs_category ON public.wellness_hubs USING btree (category_id);


--
-- Name: idx_wellness_hubs_district; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wellness_hubs_district ON public.wellness_hubs USING btree (district_id);


--
-- Name: idx_wellness_hubs_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wellness_hubs_name ON public.wellness_hubs USING btree (wellness_hub_name);


--
-- Name: idx_wellness_hubs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wellness_hubs_status ON public.wellness_hubs USING btree (status);


--
-- Name: main_route_details fk4qgpqpuxs927cw82ui1918hdn; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.main_route_details
    ADD CONSTRAINT fk4qgpqpuxs927cw82ui1918hdn FOREIGN KEY (district_id) REFERENCES public.districts(district_id);


--
-- Name: notification fk5wqygwhh84f4eaw9rug9yibvb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT fk5wqygwhh84f4eaw9rug9yibvb FOREIGN KEY (request_id) REFERENCES public.account_requests(request_id);


--
-- Name: main_route_categories fk6sodk7if1nvjjoo1umyjo2199; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.main_route_categories
    ADD CONSTRAINT fk6sodk7if1nvjjoo1umyjo2199 FOREIGN KEY (category_id) REFERENCES public.categories(category_id);


--
-- Name: account_requests fk7w7jgj92rmkp7bb0vl0cg4555; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_requests
    ADD CONSTRAINT fk7w7jgj92rmkp7bb0vl0cg4555 FOREIGN KEY (district_id) REFERENCES public.districts(district_id);


--
-- Name: wellness_hubs fk9xgpucocelyri1a536cn26rya; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_hubs
    ADD CONSTRAINT fk9xgpucocelyri1a536cn26rya FOREIGN KEY (district_id) REFERENCES public.districts(district_id);


--
-- Name: emergency_services fkab45o9hfl80u5nfd30certu5n; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_services
    ADD CONSTRAINT fkab45o9hfl80u5nfd30certu5n FOREIGN KEY (district_id) REFERENCES public.districts(district_id);


--
-- Name: emergency_services fkfqojsial8e5kxo102ny0u713; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_services
    ADD CONSTRAINT fkfqojsial8e5kxo102ny0u713 FOREIGN KEY (category_id) REFERENCES public.categories(category_id);


--
-- Name: main_route_categories fkktay8hf7a6ehkl6r4wihvv9x2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.main_route_categories
    ADD CONSTRAINT fkktay8hf7a6ehkl6r4wihvv9x2 FOREIGN KEY (route_id) REFERENCES public.main_routes(route_id);


--
-- Name: main_route_details fknx7y7eggm69k4b0no9ynh1igh; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.main_route_details
    ADD CONSTRAINT fknx7y7eggm69k4b0no9ynh1igh FOREIGN KEY (route_id) REFERENCES public.main_routes(route_id);


--
-- Name: wellness_hubs fkpos7jk4c117pn4mst9vnxbbag; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wellness_hubs
    ADD CONSTRAINT fkpos7jk4c117pn4mst9vnxbbag FOREIGN KEY (category_id) REFERENCES public.categories(category_id);


--
-- Name: account_requests fksmw9cu2ssqogtrhr671chru1v; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_requests
    ADD CONSTRAINT fksmw9cu2ssqogtrhr671chru1v FOREIGN KEY (category_id) REFERENCES public.categories(category_id);


--
-- PostgreSQL database dump complete
--

\unrestrict XyzCSprM4a0nGhqz4ySl0OiTwGWTBbtFfVyk1G2OdUNRwCr4yC1jcIly7qt7PVY

