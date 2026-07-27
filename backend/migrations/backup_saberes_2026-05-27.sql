--
-- PostgreSQL database dump
--

\restrict lIVTKY6yDn3gpI4XkEypR7A8n5RnvmeELEJgP8GvPXhabEWFfQJSOZp1wqbcg71

-- Dumped from database version 18.4 (Debian 18.4-1.pgdg13+1)
-- Dumped by pg_dump version 18.4

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: archivo_paciente; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.archivo_paciente (
    id integer NOT NULL,
    paciente_id integer NOT NULL,
    nombre character varying(200),
    descripcion text,
    url text NOT NULL,
    public_id character varying(200),
    tipo character varying(100),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.archivo_paciente OWNER TO postgres;

--
-- Name: archivo_paciente_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.archivo_paciente_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.archivo_paciente_id_seq OWNER TO postgres;

--
-- Name: archivo_paciente_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.archivo_paciente_id_seq OWNED BY public.archivo_paciente.id;


--
-- Name: bloqueo_horario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bloqueo_horario (
    id integer NOT NULL,
    fecha_inicio timestamp without time zone NOT NULL,
    fecha_fin timestamp without time zone NOT NULL,
    motivo character varying(200),
    creado_por integer,
    profesional_id integer
);


ALTER TABLE public.bloqueo_horario OWNER TO postgres;

--
-- Name: bloqueo_horario_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bloqueo_horario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bloqueo_horario_id_seq OWNER TO postgres;

--
-- Name: bloqueo_horario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bloqueo_horario_id_seq OWNED BY public.bloqueo_horario.id;


--
-- Name: catalogo_procedimiento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.catalogo_procedimiento (
    id integer NOT NULL,
    nombre character varying(200) NOT NULL,
    monto numeric(10,2) NOT NULL,
    activo boolean DEFAULT true
);


ALTER TABLE public.catalogo_procedimiento OWNER TO postgres;

--
-- Name: catalogo_procedimiento_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.catalogo_procedimiento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.catalogo_procedimiento_id_seq OWNER TO postgres;

--
-- Name: catalogo_procedimiento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.catalogo_procedimiento_id_seq OWNED BY public.catalogo_procedimiento.id;


--
-- Name: cita; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cita (
    id integer NOT NULL,
    paciente_id integer,
    profesional_id integer NOT NULL,
    fecha_hora timestamp without time zone NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    observaciones text,
    procedimiento_nombre character varying(200),
    referencia character varying(200),
    CONSTRAINT cita_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'confirmada'::character varying, 'en_atencion'::character varying, 'realizada'::character varying, 'cancelada'::character varying])::text[])))
);


ALTER TABLE public.cita OWNER TO postgres;

--
-- Name: cita_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cita_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cita_id_seq OWNER TO postgres;

--
-- Name: cita_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cita_id_seq OWNED BY public.cita.id;


--
-- Name: encuesta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.encuesta (
    id integer NOT NULL,
    paciente_id integer NOT NULL,
    token character varying(200),
    estrellas integer,
    comentario text,
    estado character varying(20) DEFAULT 'pendiente'::character varying,
    enviada_en timestamp without time zone,
    respondida_en timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT encuesta_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'enviada'::character varying, 'respondida'::character varying])::text[]))),
    CONSTRAINT encuesta_estrellas_check CHECK (((estrellas >= 1) AND (estrellas <= 5)))
);


ALTER TABLE public.encuesta OWNER TO postgres;

--
-- Name: encuesta_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.encuesta_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.encuesta_id_seq OWNER TO postgres;

--
-- Name: encuesta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.encuesta_id_seq OWNED BY public.encuesta.id;


--
-- Name: ficha_clinica; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ficha_clinica (
    id integer NOT NULL,
    paciente_id integer NOT NULL,
    profesional_id integer NOT NULL,
    fecha timestamp without time zone DEFAULT now() NOT NULL,
    motivo_consulta text NOT NULL,
    diagnostico text,
    tratamiento text,
    observaciones text
);


ALTER TABLE public.ficha_clinica OWNER TO postgres;

--
-- Name: ficha_clinica_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ficha_clinica_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ficha_clinica_id_seq OWNER TO postgres;

--
-- Name: ficha_clinica_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ficha_clinica_id_seq OWNED BY public.ficha_clinica.id;


--
-- Name: ficha_ingreso_1; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ficha_ingreso_1 (
    id integer NOT NULL,
    paciente_id integer NOT NULL,
    profesional_id integer NOT NULL,
    fecha timestamp without time zone DEFAULT now() NOT NULL,
    direccion text,
    paridad character varying(100),
    fur character varying(100),
    mac character varying(100),
    ant_morbidos text,
    ant_familiares text,
    ant_ca_mama character varying(100),
    medicamentos text,
    tabaco character varying(100),
    alcohol character varying(100),
    drogas character varying(100),
    alergias text,
    cirugias text,
    examenes_sangre text,
    ivs character varying(100),
    orientacion_sexual character varying(100),
    parejas_sexuales character varying(100),
    pareja_actual character varying(100),
    menarquia character varying(100),
    its text,
    uso_pstv character varying(100),
    eco_tv character varying(100),
    pap character varying(100),
    presion_arterial character varying(50),
    peso character varying(50),
    altura character varying(50),
    efm text,
    especulo text,
    motivo_consulta text,
    indicaciones text,
    observaciones text
);


ALTER TABLE public.ficha_ingreso_1 OWNER TO postgres;

--
-- Name: ficha_ingreso_1_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ficha_ingreso_1_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ficha_ingreso_1_id_seq OWNER TO postgres;

--
-- Name: ficha_ingreso_1_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ficha_ingreso_1_id_seq OWNED BY public.ficha_ingreso_1.id;


--
-- Name: ficha_ingreso_2; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ficha_ingreso_2 (
    id integer NOT NULL,
    paciente_id integer NOT NULL,
    profesional_id integer NOT NULL,
    fecha timestamp without time zone DEFAULT now() NOT NULL,
    motivo_consulta text,
    edad character varying(20),
    gpa character varying(100),
    ocupacion character varying(100),
    pareja character varying(100),
    red_apoyo text,
    ant_morbidos text,
    cirugias text,
    alergias text,
    medicamentos text,
    tabaco character varying(100),
    alcohol character varying(100),
    drogas character varying(100),
    examenes_sangre text,
    ant_cacu character varying(100),
    ant_ca_mama character varying(100),
    menarquia character varying(100),
    mac character varying(100),
    menstruaciones text,
    fur character varying(100),
    ias character varying(100),
    parejas_sexuales character varying(100),
    sexo_biologico character varying(100),
    its text,
    eco_tv character varying(100),
    pap character varying(100),
    eco_mam_mamo character varying(100),
    observaciones text
);


ALTER TABLE public.ficha_ingreso_2 OWNER TO postgres;

--
-- Name: ficha_ingreso_2_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ficha_ingreso_2_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ficha_ingreso_2_id_seq OWNER TO postgres;

--
-- Name: ficha_ingreso_2_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ficha_ingreso_2_id_seq OWNED BY public.ficha_ingreso_2.id;


--
-- Name: flujo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flujo (
    id integer NOT NULL,
    paciente_id integer NOT NULL,
    profesional_id integer,
    tipo_examen character varying(200),
    nombre character varying(200),
    fecha_toma date NOT NULL,
    entregado boolean DEFAULT false,
    codigo character varying(100),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.flujo OWNER TO postgres;

--
-- Name: flujo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.flujo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.flujo_id_seq OWNER TO postgres;

--
-- Name: flujo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.flujo_id_seq OWNED BY public.flujo.id;


--
-- Name: frase_diaria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.frase_diaria (
    id integer NOT NULL,
    usuario_id integer,
    frase text NOT NULL,
    fecha date DEFAULT CURRENT_DATE,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.frase_diaria OWNER TO postgres;

--
-- Name: frase_diaria_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.frase_diaria_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.frase_diaria_id_seq OWNER TO postgres;

--
-- Name: frase_diaria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.frase_diaria_id_seq OWNED BY public.frase_diaria.id;


--
-- Name: paciente; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.paciente (
    id integer NOT NULL,
    rut character varying(12),
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    fecha_nacimiento date,
    telefono character varying(15),
    email character varying(150)
);


ALTER TABLE public.paciente OWNER TO postgres;

--
-- Name: paciente_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.paciente_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.paciente_id_seq OWNER TO postgres;

--
-- Name: paciente_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.paciente_id_seq OWNED BY public.paciente.id;


--
-- Name: pago; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pago (
    id integer NOT NULL,
    paciente_id integer NOT NULL,
    cita_id integer,
    fecha timestamp without time zone DEFAULT now() NOT NULL,
    monto numeric(10,2) NOT NULL,
    metodo character varying(50) NOT NULL,
    estado character varying(20) DEFAULT 'pagado'::character varying NOT NULL,
    notas text,
    numero_bono character varying(100),
    estado_bono character varying(50) DEFAULT 'pendiente'::character varying,
    CONSTRAINT pago_estado_check CHECK (((estado)::text = ANY ((ARRAY['pagado'::character varying, 'pendiente'::character varying, 'condonado'::character varying])::text[]))),
    CONSTRAINT pago_metodo_check CHECK (((metodo)::text = ANY ((ARRAY['efectivo'::character varying, 'transferencia'::character varying, 'debito'::character varying, 'credito'::character varying, 'fonasa'::character varying])::text[])))
);


ALTER TABLE public.pago OWNER TO postgres;

--
-- Name: pago_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pago_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pago_id_seq OWNER TO postgres;

--
-- Name: pago_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pago_id_seq OWNED BY public.pago.id;


--
-- Name: pap; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pap (
    id integer NOT NULL,
    paciente_id integer NOT NULL,
    profesional_id integer,
    nombre character varying(200),
    fecha_toma date NOT NULL,
    resultado character varying(200),
    estado_envio character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    notas text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT pap_estado_envio_check CHECK (((estado_envio)::text = ANY ((ARRAY['pendiente'::character varying, 'enviado'::character varying])::text[])))
);


ALTER TABLE public.pap OWNER TO postgres;

--
-- Name: pap_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pap_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pap_id_seq OWNER TO postgres;

--
-- Name: pap_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pap_id_seq OWNED BY public.pap.id;


--
-- Name: procedimiento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.procedimiento (
    id integer NOT NULL,
    paciente_id integer NOT NULL,
    catalogo_procedimiento_id integer,
    nombre character varying(200) NOT NULL,
    monto numeric(10,2) NOT NULL,
    metodo character varying(50) NOT NULL,
    estado character varying(20) DEFAULT 'pagado'::character varying NOT NULL,
    fecha timestamp without time zone DEFAULT now() NOT NULL,
    notas text,
    CONSTRAINT procedimiento_estado_check CHECK (((estado)::text = ANY ((ARRAY['pagado'::character varying, 'pendiente'::character varying])::text[]))),
    CONSTRAINT procedimiento_metodo_check CHECK (((metodo)::text = ANY ((ARRAY['efectivo'::character varying, 'transferencia'::character varying, 'debito'::character varying, 'credito'::character varying, 'fonasa'::character varying])::text[])))
);


ALTER TABLE public.procedimiento OWNER TO postgres;

--
-- Name: procedimiento_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.procedimiento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.procedimiento_id_seq OWNER TO postgres;

--
-- Name: procedimiento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.procedimiento_id_seq OWNED BY public.procedimiento.id;


--
-- Name: profesional; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profesional (
    id integer NOT NULL,
    rut character varying(12) NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    especialidad character varying(100) NOT NULL
);


ALTER TABLE public.profesional OWNER TO postgres;

--
-- Name: profesional_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.profesional_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.profesional_id_seq OWNER TO postgres;

--
-- Name: profesional_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.profesional_id_seq OWNED BY public.profesional.id;


--
-- Name: usuario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuario (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash character varying(255) NOT NULL,
    rol character varying(20) DEFAULT 'personal'::character varying NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    profesional_id integer,
    CONSTRAINT usuario_rol_check CHECK (((rol)::text = ANY ((ARRAY['admin'::character varying, 'secretaria'::character varying, 'matrona'::character varying])::text[])))
);


ALTER TABLE public.usuario OWNER TO postgres;

--
-- Name: usuario_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuario_id_seq OWNER TO postgres;

--
-- Name: usuario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuario_id_seq OWNED BY public.usuario.id;


--
-- Name: archivo_paciente id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archivo_paciente ALTER COLUMN id SET DEFAULT nextval('public.archivo_paciente_id_seq'::regclass);


--
-- Name: bloqueo_horario id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bloqueo_horario ALTER COLUMN id SET DEFAULT nextval('public.bloqueo_horario_id_seq'::regclass);


--
-- Name: catalogo_procedimiento id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.catalogo_procedimiento ALTER COLUMN id SET DEFAULT nextval('public.catalogo_procedimiento_id_seq'::regclass);


--
-- Name: cita id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cita ALTER COLUMN id SET DEFAULT nextval('public.cita_id_seq'::regclass);


--
-- Name: encuesta id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.encuesta ALTER COLUMN id SET DEFAULT nextval('public.encuesta_id_seq'::regclass);


--
-- Name: ficha_clinica id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ficha_clinica ALTER COLUMN id SET DEFAULT nextval('public.ficha_clinica_id_seq'::regclass);


--
-- Name: ficha_ingreso_1 id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ficha_ingreso_1 ALTER COLUMN id SET DEFAULT nextval('public.ficha_ingreso_1_id_seq'::regclass);


--
-- Name: ficha_ingreso_2 id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ficha_ingreso_2 ALTER COLUMN id SET DEFAULT nextval('public.ficha_ingreso_2_id_seq'::regclass);


--
-- Name: flujo id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flujo ALTER COLUMN id SET DEFAULT nextval('public.flujo_id_seq'::regclass);


--
-- Name: frase_diaria id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frase_diaria ALTER COLUMN id SET DEFAULT nextval('public.frase_diaria_id_seq'::regclass);


--
-- Name: paciente id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paciente ALTER COLUMN id SET DEFAULT nextval('public.paciente_id_seq'::regclass);


--
-- Name: pago id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pago ALTER COLUMN id SET DEFAULT nextval('public.pago_id_seq'::regclass);


--
-- Name: pap id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pap ALTER COLUMN id SET DEFAULT nextval('public.pap_id_seq'::regclass);


--
-- Name: procedimiento id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procedimiento ALTER COLUMN id SET DEFAULT nextval('public.procedimiento_id_seq'::regclass);


--
-- Name: profesional id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profesional ALTER COLUMN id SET DEFAULT nextval('public.profesional_id_seq'::regclass);


--
-- Name: usuario id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario ALTER COLUMN id SET DEFAULT nextval('public.usuario_id_seq'::regclass);


--
-- Data for Name: archivo_paciente; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.archivo_paciente (id, paciente_id, nombre, descripcion, url, public_id, tipo, created_at) FROM stdin;
1	2	133628785070280232.jpg	\N	https://res.cloudinary.com/dzq91eyhj/image/upload/v1779767123/saberes/pacientes/2/uhbi4brn7ces9cnpun34.jpg	saberes/pacientes/2/uhbi4brn7ces9cnpun34	image/jpeg	2026-05-25 23:45:24.629103
8	80	Patricia Montecinos.pdf	\N	https://res.cloudinary.com/dzq91eyhj/raw/upload/v1779834401/saberes/pacientes/80/zfxyy55kccxi6jtxtcqj	saberes/pacientes/80/zfxyy55kccxi6jtxtcqj	application/pdf	2026-05-26 18:26:41.748221
\.


--
-- Data for Name: bloqueo_horario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bloqueo_horario (id, fecha_inicio, fecha_fin, motivo, creado_por, profesional_id) FROM stdin;
4	2026-05-16 12:00:00	2026-05-16 16:00:00	Tengo clases	\N	\N
40	2026-05-21 17:30:00	2026-05-21 20:00:00	Feriado	\N	1
\.


--
-- Data for Name: catalogo_procedimiento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.catalogo_procedimiento (id, nombre, monto, activo) FROM stdin;
1	PAP	8000.00	t
2	FLUJO PARTICULAR	6150.00	t
3	TOMA FLUJO	5000.00	t
4	TOMA PANEL	5000.00	t
5	PANEL PARTICULAR	6920.00	t
6	SAYANA	22000.00	t
7	INYECCION	5000.00	t
8	NOVAFEM	12000.00	t
9	MESIGYNA	12000.00	t
10	PLASMAPEN	40000.00	t
11	INSERCIÓN IMPLANTE	110000.00	t
12	INSERCIÓN DISPOSITIVO HORMONAL	120000.00	t
13	INSERCIÓN DISPOSITIVO NO HORMONAL	55000.00	t
14	EXTRACCIÓN IMPLANTE	35000.00	t
15	EXTRACCIÓN DISPOSITIVO	35000.00	t
16	PCR VPH	15000.00	t
17	RECAMBIO IMPLANTE	135000.00	t
18	RECAMBIO DIU HORMONAL	140000.00	t
19	Control gine FONASA	9593.00	t
20	Control gine particular	20000.00	t
21	Control gine estudiantes	12000.00	t
22	Online fonasa	9593.00	t
23	Online particular	10000.00	t
\.


--
-- Data for Name: cita; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cita (id, paciente_id, profesional_id, fecha_hora, estado, observaciones, procedimiento_nombre, referencia) FROM stdin;
66	51	1	2026-05-22 17:30:00	realizada		Control gine FONASA	\N
67	52	1	2026-05-22 18:00:00	realizada		Control gine FONASA	\N
43	32	1	2026-05-19 19:00:00	realizada		\N	\N
68	53	1	2026-05-22 18:30:00	realizada		Control gine FONASA	\N
42	31	1	2026-05-19 18:30:00	realizada		\N	\N
70	54	1	2026-05-22 19:00:00	realizada		Control gine estudiantes	\N
41	30	1	2026-05-19 16:30:00	realizada		\N	\N
45	35	1	2026-05-19 16:00:00	realizada		\N	\N
71	57	2	2026-05-25 12:00:00	realizada		SAYANA	\N
93	70	2	2026-05-26 10:30:00	en_atencion		Control gine FONASA	\N
86	69	2	2026-05-26 09:00:00	realizada		Control gine FONASA	\N
88	71	2	2026-05-26 13:00:00	en_atencion		Control gine FONASA	\N
39	29	1	2026-05-19 15:30:00	realizada		\N	\N
72	58	2	2026-05-25 14:30:00	realizada		\N	\N
38	28	1	2026-05-19 15:00:00	realizada		\N	\N
37	27	2	2026-05-19 13:30:00	realizada		\N	\N
90	72	2	2026-05-26 13:30:00	en_atencion		Control gine FONASA	\N
36	26	2	2026-05-19 13:00:00	realizada		\N	\N
35	25	2	2026-05-19 12:30:00	realizada	MAMA CAROLAINE	\N	\N
33	25	2	2026-05-19 12:00:00	realizada		\N	\N
28	17	1	2026-05-18 16:05:00	realizada		\N	\N
101	79	1	2026-05-26 16:00:00	realizada		Control gine FONASA	\N
77	63	1	2026-05-25 16:30:00	realizada		Control gine FONASA	\N
73	59	1	2026-05-25 17:00:00	realizada		\N	\N
98	76	1	2026-05-26 17:00:00	realizada		Control gine FONASA	\N
74	60	1	2026-05-25 17:30:00	realizada		\N	\N
60	44	1	2026-05-20 16:45:00	realizada		\N	\N
58	42	1	2026-05-20 17:00:00	realizada		Control gine FONASA	\N
83	66	1	2026-05-25 18:30:00	realizada		Control gine FONASA	\N
31	23	2	2026-05-19 10:00:00	realizada		\N	\N
75	61	1	2026-05-25 19:00:00	realizada		\N	\N
82	64	1	2026-05-25 18:00:00	realizada		Control gine particular	\N
107	80	1	2026-05-26 17:30:00	realizada		Control gine estudiantes	\N
32	24	2	2026-05-19 11:00:00	en_atencion		\N	\N
44	34	1	2026-05-19 14:30:00	realizada		\N	\N
94	\N	2	2026-05-26 12:00:00	pendiente	\N	\N	Francisca Monsalve
53	39	1	2026-05-20 14:30:00	realizada		Control gine FONASA	\N
52	38	2	2026-05-20 12:00:00	realizada		INYECCION	\N
51	37	2	2026-05-20 11:30:00	realizada		Control gine FONASA	\N
50	36	2	2026-05-20 09:30:00	realizada		Online particular	\N
59	43	1	2026-05-20 18:00:00	realizada		SAYANA	\N
61	45	2	2026-05-21 11:30:00	realizada		Control gine FONASA	\N
62	46	2	2026-05-21 12:00:00	realizada		\N	\N
63	47	2	2026-05-21 12:30:00	realizada		\N	\N
64	48	2	2026-05-21 13:00:00	realizada		Control gine FONASA	\N
65	49	1	2026-05-21 17:00:00	realizada		Control gine FONASA	\N
84	67	2	2026-05-25 11:30:00	realizada		\N	\N
85	68	2	2026-05-25 12:30:00	realizada		Control gine FONASA	\N
\.


--
-- Data for Name: encuesta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.encuesta (id, paciente_id, token, estrellas, comentario, estado, enviada_en, respondida_en, created_at) FROM stdin;
1	2	MS0y	\N	\N	pendiente	2026-05-18 21:39:14.494579	\N	2026-05-18 21:39:14.258287
2	33	Mi0zMw==	\N	\N	pendiente	2026-05-18 21:46:35.435917	\N	2026-05-18 21:46:35.249341
3	7	My03	\N	\N	pendiente	2026-05-18 21:50:13.179862	\N	2026-05-18 21:50:12.980364
4	2	NC0y	5	\N	respondida	2026-05-19 00:04:34.767461	2026-05-19 00:06:03.898235	2026-05-19 00:04:34.517863
5	33	NS0zMw==	5	\N	respondida	2026-05-19 00:06:51.553189	2026-05-19 00:07:42.100468	2026-05-19 00:06:51.307985
7	7	Ny03	\N	\N	pendiente	2026-05-25 16:11:06.819623	\N	2026-05-25 16:11:06.611788
\.


--
-- Data for Name: ficha_clinica; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ficha_clinica (id, paciente_id, profesional_id, fecha, motivo_consulta, diagnostico, tratamiento, observaciones) FROM stdin;
1	2	1	2026-05-15 00:57:57.910633	Le duele la vagina	Candida	Fluconazol	
2	2	1	2026-05-15 00:58:23.611876	Dolor	Itu	Nitrofurantoina	
3	2	2	2026-05-15 01:10:56.987566	xx	xx	xx	
5	8	1	2026-05-15 19:49:06.658018	Revisión de examenes	ECO TV NORMAL\nVIT D 28.1\nVIT B12 460	AC MEFENAMICO EN PERIODO MENSTRUAL C 8 X MAX 5 DIAS\nVIT D 50.000 UI X SEMANA X 8 SEM\nNEUROBIONTA ADVANCE 1 CAP DIARIA	refiere que aun no decide si usar o no mac 
6	7	1	2026-05-16 03:28:31.384499	asdfdsfaa	asdfasdf	asdfasdf	asdfasdf
7	2	2	2026-05-17 00:00:00	caca	cada	cc	
8	2	1	2026-05-17 00:00:00	pap	pap	pap	pap
9	28	1	2026-05-19 00:00:00	revisión examenes	no hay itu, trae examenes oc y uro y están negativos. 	dejo cranberry para reforzar y prevenir itu	refiere que ha tenido mejoras con flavoxato
10	52	1	2026-05-22 00:00:00	dolor en act está en tto con psicóloga hace 2 meses, pero mantiene dolor,  		 inspección hartos foliculitis\nTV dolor al ingreso, poca fuerza en piso pélvico\nderivo a cesar	  
11	59	1	2026-05-25 00:00:00	inició arlette en enero y está con doble sangrado 	cambio de mac	cambio de mac a slinda, educo en cambio y educo en posibilidades 	
12	2	1	2026-05-25 00:00:00	pap			
13	80	1	2026-05-26 00:00:00	sangrado y dolor en útero, coágulos grandes, dismenorrea membranosa, fue al hospital y solo dejaron ibuprofeno\n\n	dismenorrea membranosa o aborto	solicito eco tv, control con resultados 	
\.


--
-- Data for Name: ficha_ingreso_1; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ficha_ingreso_1 (id, paciente_id, profesional_id, fecha, direccion, paridad, fur, mac, ant_morbidos, ant_familiares, ant_ca_mama, medicamentos, tabaco, alcohol, drogas, alergias, cirugias, examenes_sangre, ivs, orientacion_sexual, parejas_sexuales, pareja_actual, menarquia, its, uso_pstv, eco_tv, pap, presion_arterial, peso, altura, efm, especulo, motivo_consulta, indicaciones, observaciones) FROM stdin;
1	7	1	2026-05-16 03:28:55.028908	asdfas	asdfsf	asfda	fasdfa	dasf	asdf	asdf	asdf	asdf	asdf	asdf	asdf	asdf	asdf	asdf	hetero											normal		afdsfasf		
2	2	1	2026-05-16 19:19:25.33012																hetero											normal		dsaf		
3	2	1	2026-05-16 19:19:25.413374																hetero											normal		dsaf		
4	69	2	2026-05-26 00:00:00	gabriel toro 236 thno 	nuligesta	05-03-2026 V/ 28 dias , dismenorrea: 10/10, sangrado : regular	femelle 20 desde julio 2025	no	abuelo materno dm	no	no	no	social	no	no	no	hace mas de un año	16	hetero	2	si hace 6 meses	14 años 	no	no	NUNCA 	nunca 	129/75			no aplica	no aplica	acude por dudas de mac , refiere amenorrea hace 3 meses y los últimos ciclos fueron con spotting. Ella desea que le llegue periodo menstrual pues eso la deja tranquila.	educo sobre cambio de mac de femelle 20 a femelle (receta por 3 meses)\nabstinencia por 7 días\neduco sobre toma de pap / se posterga por decisión de paciente\nretornar en caso de que no llegue periodo o toma de pap	
5	70	2	2026-05-26 00:00:00	la concepcion 330 hualqui	nuligesta	8-05-2026 III/ 28 dias , dimsenorrea: 6/10 sangrado : regular	sin mac hace un año ( calendario)	resistencia a la insulina tratada?	mama dm y papa hta 	no	arimeprazol de 5 mg, esopiclona de 3mg, fluoxetina de 230mg, trasodona 100 mfg, olansaprina (depresión , trastorno de ansiedad y tlp)	no	social	no	no	amigdalas ( 2004) mini lipo (2023)	11-2026: deficit de vitamina D , médico le dijo que ya no tenia ri	17	hetero	6	si hace 2 años 	11	no	ocasional ( semana fertil)	05-2025 normal	05-2025 normal	128/85			no aplica	no aplica	Acude junto a su pareja, pues en dos años más desean gestación. Paciente refiere cefaleas constantes, náuseas y vómitos, asco. Esta sin mac, y recién este mes reconoce su flujo fértil , tuvo rrss en periodo fértil , jueves 22. Pareja Sebastián (personal trainer) 26 años, sin patologias de base , sin chequeo.	postergo toma de pap por dinero según dice la paciente\nsolicito ex sangre (incluida beta hcg)\nsolicito eco tv\n pido exámenes de sangre a pareja también\nderivo con su psiquiatra para que le dé el pase a planificar una gestación.\nPC: con resultados exámenes o toma de pap\n	
6	72	2	2026-05-26 00:00:00	las violetas 3240 villa los conquistasdores ccp	nuligesta	18/05/2026 IV/28 dias , dimsenorrea: 8/10 sangrado : regular	aco , anulete cd hace añois	resistencia insulina	no	no	pregabalina 	no	no	no	no	no	03-2026: resistencia insulina, deficit  b12 	17 años	hetero	2	si hace 10 años	15	no	no	nunca	2022 normal	136/89 			no aplica	cuello app sano, leucorrea inespecífica . blanca lechosa 	control gine, tens en el neo de hggb. Ella misma se indico anulete cd hace años 	cambio de mac a sayana por cefaleas constantes presion al límite y dant de 3 pre infartos inyección próxima 18-08-2026\nse toma pap  y flujo vaginal\neduco sobre aseo genital (usa protector y jabón)\nproxima inyeccion 18-08-2026\npc control con resultado ex flujo vaginal 	Paciente muy tímida 
\.


--
-- Data for Name: ficha_ingreso_2; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ficha_ingreso_2 (id, paciente_id, profesional_id, fecha, motivo_consulta, edad, gpa, ocupacion, pareja, red_apoyo, ant_morbidos, cirugias, alergias, medicamentos, tabaco, alcohol, drogas, examenes_sangre, ant_cacu, ant_ca_mama, menarquia, mac, menstruaciones, fur, ias, parejas_sexuales, sexo_biologico, its, eco_tv, pap, eco_mam_mamo, observaciones) FROM stdin;
11	18	1	2026-05-18 00:00:00	DOLOR DE CABEZA USANDO SU MAC, justo en pastillas placebo, incluso usando método extendido mantiene dolor, 	21 años 	nuligesta	est odontologia udec	si, hace 3 años 		no	hernias inguinales	no	aco	no	no	no				12 años	acotol hace 2 años y medio 	regulares	ciclo extendido	18 años	16	hombres	no		no		duco en mac\nevaluamos osibilidad de cambio marca, cambio a estradiol o cambio a progestina sola,\nelije camio de marca, dejo sibilla,\neduco en cambio\nprox control en 1 mes para reevaluar\nPA12/84
3	3	1	2026-05-15 18:46:14.726157	inicio de mac	24 años 	nuligesta	est psicologia 4to	pareja sexual, ult 6 meses: 3		no	no	no	no	no	ocasional	marihuana ocasional						regulares	ultima semana de abril	15 años 	8	hombres	no	hace tiempo 	3/2025 IG7 saberes		PA 123/70\neduco en mac, quiere pastillas, dejo drospi+ee\neduco en forma de inicio\nrefiere tener heridas en zona genital\ninspección: heridas en periné, y entre medio de labio interno izquierdo, parecen solo por humedad, pero educo en posibilidad de herpes\ndejo pomada + aseo con bicarbonato\npor solicitud de ella entrego orden panel its y ex sangre its
12	19	1	2026-05-18 00:00:00	bochornos, dolores de cabeza, en ev en cesfam \npicazón desde 2 días olor distinto, 	46 años 	G4P3A1	Trabaja en hostal	si, hace 7 años 		no	vesícula, esterilización, cesáreas 3	no	simifemin hace 1 mes \nsertralina (ansiedad, depresión)\ncitrato de magnesio en noche	si, 1 cajetilla diaria	no	marihuana muy ocasional	se los tomó en cesfam pero no le han entrega resultados 	no	tía materna 	12 años	esterilizada a los 33 años 	regulares, 10-15 días, flujo abundante, sin dolor 	1 mayo	19 años 	50	hombres	no	no	menos de 1 año todo ok cesfam 	sep 2025 todo normal 	sudores nocturnos, dolores de cabeza \neduco en climaterio y menopausia \nPA 114/83\nEDUCO en uso de simifemin, sugiero control estricto, ha referido mejoras tras su uso, control cada 3 meses idealmente\nla farmaceutica le entregó el medicamento\ninspección: enrojecimiento leve\ndejo tto triple, para ella y su pareja que tmb tenia sintomas\neduco en volver con resutlados de ex tomados en cesfam y para reevaluar simifemin
4	5	1	2026-05-15 19:33:55.21662	evaluar mac 	22 años 	nuligesta	asistente dental, trabaja en uno salud 	si, hace 2 años 		no	no	no	no	cigarro social	ocasional 	no				14 años 	acotol hace 2 años 	dejo mac a fines de febrero, desde ahi su menstruación cambió, manchados café 	inicios de abril	16 años 	5	hombres	no		hace 2 años, normal, samar 		PA 104/68\neduco en mac, quiere seguir con sus mismas pastillas pero una versión más barata, dejo sibilla\ncontrol en 1 mes\neduco en pap
6	9	1	2026-05-15 21:02:53.437835	reiniciar mac, sugirieron antiandrógeno por acné 	27 años 	G1P0A1 enero de este año 	psicológica no ejerce, actualmente petsitter BABYPET.ME instagram 	si, hace 5 años CRISTOBAL 		TRASTORNO BIPOLAR	APENDICE	NO	LITIO Y LAMOTRIGINA	NO	OCASIONAL	NO	ESTE AÑO, SU PSIQUIATRIA LOS SOLICITÓ, SU MAMÁ (TERAPEUTA COMPLEMENTARIA) LOS REVISÓ \nVIT 38\nB12 338\nRESTO NORMAL 			12 AÑOS	HACE 3 AÑOS SIN MAC (USO VEXA CD) 	REGULAR, 3 DIAS, FLUJO MEDIO, SIN MOLESTIAS 	30 ABRIL	15 años 	16	hombres	NO		SI 2025 TODO OK CON MAT LIBERTAD CARES		PA 120/77\nULTIMA ACTIVIDAD SEXUAL SEMANA PASADA, \nEDUCO EN MAC, QUIERE ACO, DEJO VEXA CD (LA USABA ANTES)\nEDUCO EN INICIO, SUGIERO TEST EMB EN 1 SEM\nREVISO EXAMENES, DEJO VIT D Y B12\nREFIERE SUFRE DE CONSTANTES MOLESTIAS URINARIAS, DEJO CRANBERRY PREVENTIVO
7	10	1	2026-05-15 21:25:07.883233	abandonó aco por falta de dinero\nusaba dixi 35\nreiniciar mac 	18 años 	nuligesta	est gastronomia 	si, hace 2 años 	es de cerro alto los álamos 	no	apendice	no	no	no	muy ocasional	no				13 años	sin mac desde este martes 	amenorrea x mac	le llegó ayer post abandono de mac 	17 años	16	hombres	no		no 		 educo en mac, quiere volver a usar implante, educo al respecto
8	11	1	2026-05-15 21:46:03.652546	control gine, dolor uterino, ante cambio de alimentación y ejercicio ha mejorado en el último tiempo 	26 años 	nuligesta	trabaja ing civil en constructora	no 		no	no	no	fentermina día por medio	no	no	no	vit d baja, b12, menos de un mes, con suplementación actual 			14 años 	nada	regular, 3-4 días, dolor 8-9/10, solo en menstruación 	1/5/26	NUNCA 				NUNCA 			ante dolor menstrual usa ac mefenamico, lo usa previo a la menstruación y al dolor\ndejo orden eco abd gine\ncontrol para ver si inicia mac con resultado de eco, ahí haremos educacion completa de mac\neduco en qu camino saludable que tiene actualmente debe seguir\n
9	12	1	2026-05-15 22:04:51.923854	flujo amarillo, picazón, inflamado, rojo hace 1 mes 	20 años 	nuligesta	est educ parvularia 	no, hace 2 meses sin pareja sexual		no	no	no	no	cigarro ocasional	ocasional	no				12 años 	nada, antes usaba femelle 	regular, 5-6 días 	4 mayo	18 años	3	hombres	no		no 		educo en mac, dejo femelle \nPA 104/60\nCONTROL DE MAC EN 1 MES\nINSPECCION vulva roja, mucho flujo grumoso, candida\ndejo triple tto \n
13	20	1	2026-05-18 00:00:00	plasmapen, lesiones de verruga desde sep año pasado, han aparecido más y la anterior aumentada de tamaño 	25 años	nuligesta	se va h and h	si, hace 1 año 		no	no	no	no	social cigarro	social	no				14 años 	nada, pstv 		30 abril 	16 años 	5	hombres	no		cesfam en LA aun sin resultado, hace 3 sem 		 educo en vph, pcr y pap\ninspeccion 6 lesiones de verruga\nretiro con plasmapen\neduco en cuidados
14	21	1	2026-05-18 00:00:00	al toser se hace pipi, no solo gotas, 	42 años 	G6P2A4 2023 ultimo vaginal, 2003 primer parto vaginal 	trabaja pesquera 	si, hace 10 años 		asma, hipotiroidismo	08/2025 esterilización	no	levotiroxina	no	ocasional	no				13 años 	esterilizada 	regulares, 4-5 dias 	18 mayo	15 años 	5	hombres	no	post esterilización todo ok 	enero 2026 todo ok 	mamografia 2026 todo ok 	refiere que se hace pipi, anda con pañales\neduco en piso pelvico\nhace 2 smanas andaba con urgencia urinaria\ndejo flavoxato\nderivo a piso pelvico cesar\ndejo orden oc y uro\n15648090-8\n982817607\n
5	8	1	2026-05-05 00:00:00	dolor menstrual, post aborto siente que su menstruación cambió, dolor 10/10, 	27	G1P0A1 hace 2 años	profesora de inglés, trabaja en colegio gran bretaña	si, hace 3 años, hombre		migraña con aura	no	ibuprofeno, amoxicilina	propanolol	no	no	no				13 años	hace 6 años sin mac	regulares, 4-5 días, dolor 10/10, flujo medio 	17 abril	18 años	5	hombres	no	hace 2 años post aborto	nunca		FECHA ATENCIÓN: 5 MAYO \n\neduco en dolor menstrual, posibilidades y posibles tratamientos\neduco en pap\ndejo orden eco tv + vit d y b12\ncontrol con resultados, interesada en quizás tomar el camino de mac\ntuvo sibo\n
10	17	1	2026-05-18 00:00:00	iniciar mac, interesada iny comb 	22 años 	nuligesta	est obstetricia uss 4to año 	si, hace 3 meses, hombre 		asma	no	no	no	menos de una vez a la semana	ocasional	no				14 años 	nunca 	regulares, 5-6 días, ciclos de 30 días, flujo medio 	18 mayo	hace 2 meses	1	hombres	no		no		PA 165/95\nEduco al respecto, priorizo riesgo de embarazo pero indico realizar o holter o control seriado de presión \ncontrol en un mes para reevaluar metodo\ndejo orden de inyectable mensual novafem/cyclofemina
15	34	1	2026-05-19 00:00:00	PAP 	27 años 	nuligesta	est contador auditor	si, hace casi 2 años, mujer 		no	apendice 	no	escitalopram desde hoy 	cigarro ocasional	ocasional	marihuana ocasional				14 años 	nunca	irregulares, dolorosas 8/10, abundante 	fines de abril 	si, solo mujeres	3	mujeres	no	nunca	nunca 		educo en procedimiento de pap y en importancia de realización  \ncorreo: joannatiznado29@gmail.com\ninspeccion heridas por fricción en piernas\ncuello ap sano\ntomo pap
16	35	1	2026-05-19 00:00:00	reiniciar mac 	19 años 	nuligesta	est derecho 	si, hace 1 mes 		hipotiroidismo	adenoides y amigdalas	no	eutirox 75 mg	no	ocasional	no				13 años 	acotol 2022 hasta ete año enero 2026	irregular post abandono aco 	28 marzo 	16 años	4	hombres	no		nunca 		PA  107/63\neduco en mac, se interesa por trimestral pero finalmente decide volver a acotol\ndejo orden de acotol, educo en inicio\n\n
17	51	1	2026-05-22 00:00:00	flujo denso blanco, sin mal olor, genera humedad, QUIERE TOMAR PAP, dolor menstrual y en ovulación, sin mac hace 6 años 	38 años 	nuligesta	trabajo administrativo en muni talcahuano	si, hace 10 años 		no	no	no	no	15 tabacos	ocasional	no				17 años 	nada hace 6 años 	regulares, 7-8 días, doloroso 8/10, \nutiliza ac mefenámico, 	27 abril al 3 mayo 	21 años 	3	hombres	no	hace 3 años tenía un quiste ovárico 	hace 2 años 		educo en dolor menstrual, solicito eco tv\ninspeccion ok\nespeculoscopia cuello ap sano, con leve sangrado, con quiste de naboth a las 7, flujo de olor más fuerte\ntomo fv part y pap\n\n ASTETE BECERRA\ncorreo: carolaynastete@gmail.com\n
18	55	1	2026-05-22 00:00:00	sangrado post coital entre vulvas, eco hoy IMPRESIONA LESION QUISTICA 36 MM QUE AFECTA PARED VAGINAL Y LABIO POSTERIOR DEL CERVIX \nsangrado 	26 AÑOS	NULIGESTA	GEOLOGA	SI, HACE 4 AÑOS 		no	no	no	no	no	muy ocasional	no				15 años 	nunca 	irregulares, 5 dias, sangrado abundante, 	1 abril 	17 años 	3	mujeres	no	22 mayo 	nunca 		  refiere dolor en menstruacion, menstruacion irregular, dolor a la penetración  con juguete sexual, sangrado al hacer caca, comenzó hace aprox 2 años\nhoy se hizo eco: IMPRESIONA LESION QUISTICA 36 MM QUE AFECTA PARED VAGINAL Y LABIO POSTERIOR DEL CERVIX \n\nPAVLICH PASTEN\n20248469-7\n10/9/99\nCORREO: cata.pavlich@gmail.com \n\ninspeccion ok\nespeculoscopia cuello dificil de localizar, no observo directamente quiste\ntomo pap\ntv hacia el lado derecho se siente duro \n\nderivo a gine
19	60	1	2026-05-25 00:00:00	perdió depo ya que a quien se la iba a colocar se le cayó el contenido afuera 	23 años 	nuligesta	Est comercio exterior duoc 4to	si, hace 4 años 		no	no	no	no	no	social	no				14 años 	depo	amenorrea x mac	24 agosto 2025 x mac 	18 años 	16	hombre	no		2023 agosto cesfam 		cambio a sayana press\neduco en cambio
24	76	1	2026-05-26 00:00:00	cándidas frecuentes, ultima en marzo post atb, siente picazón de vez en cuando, 	34 años 	g2p1a2 6 años 	enfermera, trabaja en dialisis en lota 	si, hace 2 años 		no	cesárea	no	no	no	ocasional 	no				16 años 	nada, pstv 	regulares, 5 días, 	18 mayo	16 años 	5	hombres 	no		2026 marzo todo ok 		  inspeccion ok\nespeculoscopia flujo blanco denso abundante\ntomo fv part 
20	64	1	2026-05-25 00:00:00	posible endometriosis, iniciar anticonceptivo 	26 años 	nuligesta	prevencionista de riesgos, trabaja en forestal 	ultimos 6 meses 1 pareja sexual		no	apendice	no	no	no	no	no				11 años 	nunca 	regulares, 4 dias, dolor 7/10, flujo abundante, cambio cada 1 hora 	10 mayo 	16 años 	4	hombres	no	nunca 	nunca 		inspeccion ok\nespeculospia  cuello ap sano\ntomo pap\neduco en mac, elige aco, dejo acotol\neduco en inicio\nsolicito eco tv 
21	66	1	2026-05-25 00:00:00	pap\nse quedó el condón en la vagina, no usa mac, 	23 años 	G1P0A1 aborto provocado hace mas de un año 	pastelera trabaja en delikaten 	no, pareja sexuales en los ultimos 6 meses, 1		no	no	no	no	cigarro muy ocasional	ocasional	marihuana ocasional				12 años	pstv 	regulares, 4-5 días 	4 mayo 	19 años 	10	hombres	le dijeron que tenia vph, se hizo un ex pero no sabe cual fue ni que sepa es		hace 1 año 		inspeccion ok\nespeculoscopia cuello sensible a la toma del examen, flujo vaginal de olor mas fuerte, refiere que le hicieron un examen y tenia una bacteria pero no sabe cual, le dejaron tto, indico seguir\ntomo pap\nindico usar pae y como hacerlo\neduco en vph
22	61	1	2026-05-25 00:00:00	irritación vulvar, sintió manchado posterior a actividad sexual, molestias antes de su menstruación 	28 años 	nuligesta	psicologa, trabaja en tomé	2 aprejas sexuales en los ultimos 6 meses 		no	apendice	no	escitalopram	cigarro 1 diario	muy ocasional	no				13 años 	femelle fol 	regular, 4 días, 	hace 3 semanas	16 años 	5	hombres	vph condilomas	hace 4 años 	hace 3 años 		inspeccion ok\nespeculoscopia flujo denso, blanco fosfo\ntomo fv part\neduco en vph\ntomo pap y pcr vph\nva a tomarse panel its en orina 
23	79	1	2026-05-26 00:00:00	flujo abundante, sin olor, picazon, le dejaron metronidazol pero generó mucho dolor, luego usó ovulos de clotrimazol 500, eso mejoró los síntomas, ayer terminó su sangrado menstrual y sintió nuevamente las molestias 	34 años 	g1p0a1 16 años 	tens sapu y centro medico del trabajador 	si, hace 1 año, hombre 		asma 	cesarea	ibuprofeno, aspirina 	loratadina, desloratadina	no	no	no			mamá 	12 años 	nada, pstv 	regulares, 7 días, flujo medio, 	hace 1 sem 	16 años	2	hombres	no		hace 1-2 años 		inspección vulva irritada, pareciera que la toalla higiénica generó una dermatitis\nflujo blanco, introito enrojecido\ndejo fluconazol + pomada+ ovulos 
\.


--
-- Data for Name: flujo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.flujo (id, paciente_id, profesional_id, tipo_examen, nombre, fecha_toma, entregado, codigo, created_at) FROM stdin;
3	51	\N	Flujo particular	FLUJO PARTICULAR	2026-05-22	f	\N	2026-05-22 17:52:05.266622
4	61	1	Flujo particular	FLUJO PARTICULAR	2026-05-25	f	\N	2026-05-25 19:53:30.757066
5	68	\N	Panel particular	PANEL PARTICULAR	2026-05-25	f	\N	2026-05-25 20:32:08.824776
6	72	2	Flujo particular	FLUJO PARTICULAR	2026-05-26	f	\N	2026-05-26 14:10:36.813459
7	76	1		FLUJO PARTICULAR	2026-05-26	f	\N	2026-05-26 17:22:35.764844
\.


--
-- Data for Name: frase_diaria; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.frase_diaria (id, usuario_id, frase, fecha, created_at) FROM stdin;
\.


--
-- Data for Name: paciente; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.paciente (id, rut, nombre, apellido, fecha_nacimiento, telefono, email) FROM stdin;
3	20940694-2	Luna	Almonacid	2001-12-12	958203743	almonacidluna@gmail.com
5	21465181-5	Catalina	Castillo	2003-12-16	921819273	catacastillor7@gmail.com
8	20154010-0	Camila	Moreno Jimemez	\N	\N	\N
9	\N	Barbara 	Tapia	\N	\N	\N
10	22587123-k	Alejandra 	Iturra	\N	\N	\N
11	\N	Ninoska	Sepulveda	\N	\N	\N
12	\N	Mariana	Jara	\N	\N	\N
16	\N	Valentina 	Leal	\N	\N	\N
17	\N	Nicolh	Quiroga	\N	\N	\N
18	\N	Sofia	Estrada	\N	\N	\N
19	\N	Deny	Zambrano	\N	\N	\N
20	20619167-8	Ignacia	Neira	\N	\N	\N
21	\N	Jaqueline	Salazar	\N	\N	\N
22	\N	Ian	Ferreira	\N	\N	\N
23	\N	Scarlett 	Pino	\N	\N	\N
25	\N	Carolaine	Ulloa	\N	\N	\N
26	\N	AYLIN	MANSILLA	\N	\N	\N
27	\N	ALIN	ANANIAS	\N	\N	\N
28	\N	VIRGINIA 	AMBIADO	\N	\N	\N
29	\N	VALENTINA	MEZA	\N	\N	\N
30	\N	NOEMI	BEROIZA	\N	\N	\N
31	\N	FABIOLA	ARELLANO	\N	\N	\N
32	\N	VICTORIA	HERNANDEZ	\N	\N	\N
33	20.514.186-3	Ian	Ferreira	2000-05-28	984565837	ianferreiraleal@gmail.com
7	20.514.186-3	Ian	Ferreira	2000-05-28	+56984565837	ia.ferreira@duocuc.cl
24	 21886018-4	Agustina	Sanchez	1993-08-09	957309353	\N
34	20136426-4	Joanna 	Tiznado	1999-01-08	942494665	\N
35	\N	Martina	Riquelme	\N	\N	\N
36	\N	Francisca	Monsalve	\N	\N	\N
38	\N	Katalina	Bustamante	\N	\N	\N
37	\N	Nicole	Vidal	\N	\N	\N
39	\N	Barbara	Pilquiman	\N	\N	\N
40	\N	Sofia	Hule	\N	\N	\N
2	20.437.635-2	Javiera	Silva	2000-02-15	954888727	silvacatalan.javiera@gmail.com
41	\N	Maria Fernanda	Ramirez	\N	\N	\N
42	\N	Gabriela	Oyarzun	\N	\N	\N
43	\N	Carla	Manosalva	\N	\N	\N
44	\N	Aline	Gierke	\N	\N	\N
45	\N	Alejandra	Mansilla	\N	\N	\N
46	\N	Maura	Gomez	\N	\N	\N
47	\N	Gabriela 	Medina	\N	\N	\N
48	\N	Constanza 	Carrasco	\N	\N	\N
49	\N	Sofia 	Hule	\N	\N	\N
53	\N	Camila 	Jara	\N	\N	\N
54	\N	Anita	Herrera	\N	\N	\N
52	21711604-k	Florencia	Garrido	2004-11-18	966020796	\N
55	\N	Catalina	Pavlich	\N	\N	\N
56	\N	Leyla	Moncada	\N	\N	\N
57	\N	Leyla	Moncada	\N	\N	\N
58	\N	Victoria	Yañez	\N	\N	\N
62	\N	Carla 	Tello	\N	\N	\N
63	\N	Catalina 	Aguilar	\N	\N	\N
59	21199259-k	Camila 	Aravena	2002-12-16	\N	camila.aravena198@gmail.com
60	21253499-4	Soraya 	Coloma	2003-03-07	+56979169153	sorayacoloma18@gmail.com
51	16756752-5	Carolayn 	Astete	1987-09-28	989492114	carolaynastete@gmail.com
65	\N	Nicol	Oliva	\N	\N	\N
67	\N	Carla 	Tello Cisternas 	\N	\N	\N
66	21.137.879-4	Nicol	Oliva	1997-07-04	\N	n.olivaaraneda23@gmail.com
64	\N	Celenia	Moraga	\N	\N	\N
61	19.521.521-9	Leandra 	Santibáñez 	\N	\N	leandra.satibanez@gmail.com
68	\N	Catalina 	Vega	\N	\N	\N
71	\N	Martina 	Hazbun 	\N	\N	\N
73	\N	Paula	Artigas	\N	\N	\N
74	\N	Emily 	Troncoso	\N	\N	\N
75	\N	Emily 	Troncoso	\N	\N	\N
69	25996116-5	Miranda 	Contreras	2003-10-22	964640001	miranda.cpss@gmail.com
70	20703880-6	Karla 	Aguilera	2000-12-19	+569 58015874	ka.aguilera.b@gmail.com
72	15133308-7	Paula	Artigas	2000-12-06	+56982999327	artigaspaula15@gmail.com
79	17844340-2	Marta 	Osorio	\N	\N	\N
76	18134799-6	Karina	Escobar	1991-12-14	\N	karinaisabel.em@gmail.com
80	21714630-5	Fernanda	Montecinos	\N	\N	\N
\.


--
-- Data for Name: pago; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pago (id, paciente_id, cita_id, fecha, monto, metodo, estado, notas, numero_bono, estado_bono) FROM stdin;
72	64	\N	2026-05-25 18:04:03.587161	20000.00	transferencia	pagado	Procedimiento: Control gine particular	\N	pendiente
73	66	\N	2026-05-25 18:04:48.871124	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
74	66	\N	2026-05-25 19:13:05.559055	8000.00	debito	pagado	Procedimiento: PAP	\N	pendiente
75	61	\N	2026-05-25 19:53:13.378653	8000.00	transferencia	pendiente	Procedimiento: PAP	\N	pendiente
76	61	\N	2026-05-25 19:53:22.449192	15000.00	transferencia	pendiente	Procedimiento: PCR VPH	\N	pendiente
77	61	\N	2026-05-25 19:53:30.754562	6150.00	transferencia	pendiente	Procedimiento: FLUJO PARTICULAR	\N	pendiente
78	64	\N	2026-05-25 19:54:37.505906	8000.00	debito	pagado	Procedimiento: PAP	\N	pendiente
8	8	\N	2026-05-17 16:01:59.373009	12000.00	debito	pagado	Procedimiento: MESIGYNA	\N	pendiente
15	20	\N	2026-05-18 18:14:21.467878	60000.00	debito	pagado	Procedimiento: plasmapen	\N	pendiente
17	23	\N	2026-05-18 21:31:07.890026	22000.00	transferencia	pagado	Procedimiento: SAYANA	\N	pendiente
18	24	\N	2026-05-18 21:32:01.570533	40000.00	transferencia	pagado	Procedimiento: INSERCIÓN DISPOSITIVO NO HORMONAL	\N	pendiente
19	25	\N	2026-05-18 21:32:43.104823	8000.00	debito	pendiente	Procedimiento: PAP	\N	pendiente
20	25	\N	2026-05-18 21:34:36.333453	8000.00	debito	pendiente	Procedimiento: PAP	\N	pendiente
21	26	\N	2026-05-18 21:35:19.546815	9593.00	fonasa	pendiente	Procedimiento: Control gine FONASA	\N	pendiente
22	27	\N	2026-05-18 21:35:56.289825	5000.00	transferencia	pagado	Procedimiento: INYECCION	\N	pendiente
23	28	\N	2026-05-18 21:37:05.601532	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
24	29	\N	2026-05-18 21:38:47.615228	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
25	30	\N	2026-05-18 21:41:45.471631	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
26	31	\N	2026-05-18 21:45:05.127355	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
27	32	\N	2026-05-18 21:45:45.183225	8000.00	transferencia	pagado	Procedimiento: PAP	\N	pendiente
29	2	\N	2026-05-19 13:38:56.291388	12000.00	transferencia	pagado	Procedimiento: Control gine estudiantes	\N	pendiente
30	2	\N	2026-05-19 13:40:18.199276	8000.00	transferencia	pagado	Procedimiento: PAP	\N	pendiente
31	34	\N	2026-05-19 14:55:47.772038	8000.00	transferencia	pagado	Procedimiento: PAP	\N	pendiente
32	29	\N	2026-05-19 16:06:50.616704	80000.00	efectivo	pagado	Procedimiento: PLASMAPEN	\N	pendiente
33	36	\N	2026-05-19 16:40:04.776322	10000.00	transferencia	pagado	Procedimiento: Online particular	\N	pendiente
34	37	\N	2026-05-19 16:42:57.345818	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
35	38	\N	2026-05-19 16:43:52.714748	5000.00	transferencia	pagado	Procedimiento: INYECCION	\N	pendiente
36	39	\N	2026-05-19 16:46:13.898757	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
37	40	\N	2026-05-19 16:46:46.028362	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
38	42	\N	2026-05-20 16:40:41.706885	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
39	43	\N	2026-05-20 16:41:21.182192	22000.00	efectivo	pagado	Procedimiento: SAYANA	\N	pendiente
40	45	\N	2026-05-20 16:43:56.005881	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
41	47	\N	2026-05-20 16:44:49.800713	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
42	48	\N	2026-05-20 16:45:50.205718	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
43	46	\N	2026-05-20 21:29:41.532081	10000.00	debito	pagado	Procedimiento: Online particular	\N	pendiente
44	49	\N	2026-05-21 16:33:43.692411	9593.00	efectivo	pagado	Procedimiento: Control gine FONASA	\N	pendiente
45	51	\N	2026-05-22 17:08:39.962274	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
46	52	\N	2026-05-22 17:09:08.113089	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
47	53	\N	2026-05-22 17:09:25.828351	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
49	54	\N	2026-05-22 17:16:56.196602	12000.00	transferencia	pagado	Procedimiento: Control gine estudiantes	\N	pendiente
50	51	\N	2026-05-22 17:51:58.90382	8000.00	debito	pagado	Procedimiento: PAP	\N	pendiente
51	51	\N	2026-05-22 17:52:05.263422	6150.00	debito	pagado	Procedimiento: FLUJO PARTICULAR	\N	pendiente
53	55	\N	2026-05-22 20:26:13.671487	8000.00	efectivo	pagado	Procedimiento: PAP	\N	pendiente
54	57	\N	2026-05-25 10:56:10.838529	22000.00	efectivo	pagado	Procedimiento: SAYANA	\N	pendiente
55	58	\N	2026-05-25 13:53:55.312116	9593.00	debito	pagado	Procedimiento: Control gine FONASA	\N	pendiente
56	59	\N	2026-05-25 14:05:54.147893	9593.00	debito	pagado	Procedimiento: Control gine FONASA	\N	pendiente
57	60	\N	2026-05-25 14:06:08.134298	9593.00	debito	pagado	Procedimiento: Control gine FONASA	\N	pendiente
58	61	\N	2026-05-25 14:06:57.543264	9593.00	debito	pagado	Procedimiento: Control gine FONASA	\N	pendiente
59	61	\N	2026-05-25 14:06:58.404323	9593.00	debito	pagado	Procedimiento: Control gine FONASA	\N	pendiente
61	63	\N	2026-05-25 16:18:40.795518	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
62	63	\N	2026-05-25 16:32:46.383788	22000.00	efectivo	pagado	Procedimiento: SAYANA	\N	pendiente
63	7	\N	2026-05-25 16:47:59.17739	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
69	60	\N	2026-05-25 17:49:04.041731	22000.00	debito	pagado	Procedimiento: SAYANA	\N	pendiente
79	67	\N	2026-05-25 20:05:40.468819	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
80	68	\N	2026-05-25 20:31:28.677089	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
81	68	\N	2026-05-25 20:31:45.647195	8000.00	debito	pagado	Procedimiento: PAP	\N	pendiente
82	68	\N	2026-05-25 20:32:08.822655	6920.00	debito	pagado	Procedimiento: PANEL PARTICULAR	\N	pendiente
83	69	\N	2026-05-25 20:34:31.982725	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
84	70	\N	2026-05-25 20:37:08.370878	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
85	71	\N	2026-05-25 20:39:32.231946	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
86	72	\N	2026-05-25 20:43:15.883726	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
87	70	\N	2026-05-25 20:44:10.712148	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
88	70	\N	2026-05-25 20:44:10.751931	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
89	70	\N	2026-05-25 20:44:10.880763	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
90	76	\N	2026-05-25 20:51:59.895821	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
91	7	\N	2026-05-25 21:56:51.122082	8000.00	debito	pagado	Procedimiento: PAP	\N	pendiente
92	7	\N	2026-05-25 21:57:47.57456	8000.00	debito	pendiente	Procedimiento: PAP	\N	pendiente
93	79	\N	2026-05-26 12:48:40.320229	9593.00	fonasa	pagado	Procedimiento: Control gine FONASA	\N	pendiente
94	72	\N	2026-05-26 14:10:36.809138	6150.00	debito	pagado	Procedimiento: FLUJO PARTICULAR	\N	pendiente
95	72	\N	2026-05-26 14:10:47.365401	8000.00	debito	pagado	Procedimiento: PAP	\N	pendiente
96	72	\N	2026-05-26 14:10:53.400882	22000.00	debito	pagado	Procedimiento: SAYANA	\N	pendiente
98	76	98	2026-05-26 17:22:14.933194	15500.00	debito	pagado	fv part	\N	\N
104	80	\N	2026-05-26 18:01:54.505202	12000.00	debito	pagado	Procedimiento: Control gine estudiantes	\N	\N
\.


--
-- Data for Name: pap; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pap (id, paciente_id, profesional_id, nombre, fecha_toma, resultado, estado_envio, notas, created_at) FROM stdin;
6	32	\N	PAP	2026-05-18	\N	pendiente	\N	2026-05-18 21:45:45.186541
4	25	2	PAP	2026-05-18		pendiente	\N	2026-05-18 21:32:43.108365
9	34	1	PAP	2026-05-19	NORMAL	enviado	\N	2026-05-19 14:55:47.776633
10	51	\N	PAP	2026-05-22	\N	pendiente	\N	2026-05-22 17:51:58.907279
11	55	\N	PAP	2026-05-22	\N	pendiente	\N	2026-05-22 20:26:05.081202
12	55	\N	PAP	2026-05-22	\N	pendiente	\N	2026-05-22 20:26:13.676512
20	66	1	PAP	2026-05-25	\N	pendiente	\N	2026-05-25 19:13:05.562515
21	61	1	PAP	2026-05-25	\N	pendiente	\N	2026-05-25 19:53:13.382005
22	64	1	PAP	2026-05-25	\N	pendiente	\N	2026-05-25 19:54:37.508987
23	68	\N	PAP	2026-05-25	\N	pendiente	\N	2026-05-25 20:31:45.651863
26	72	2	PAP	2026-05-26	\N	pendiente	\N	2026-05-26 14:10:47.368776
\.


--
-- Data for Name: procedimiento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.procedimiento (id, paciente_id, catalogo_procedimiento_id, nombre, monto, metodo, estado, fecha, notas) FROM stdin;
1	2	1	PAP	17000.00	transferencia	pagado	2026-05-16 21:34:30.358915	\N
2	2	10	PLASMAPEN	40000.00	debito	pagado	2026-05-16 21:43:17.811672	\N
3	2	9	MESIGYNA	12000.00	debito	pagado	2026-05-16 21:43:44.369411	\N
4	8	9	MESIGYNA	12000.00	debito	pagado	2026-05-17 16:01:59.361646	\N
5	2	1	PAP	8000.00	debito	pagado	2026-05-18 14:45:37.36517	\N
6	2	1	PAP	8000.00	debito	pagado	2026-05-18 14:46:24.791459	\N
7	2	2	FLUJO PARTICULAR	6150.00	efectivo	pagado	2026-05-18 14:50:46.105225	\N
8	2	5	PANEL PARTICULAR	6920.00	efectivo	pagado	2026-05-18 14:51:04.119825	\N
9	2	1	PAP	8000.00	debito	pagado	2026-05-18 15:49:15.248228	\N
10	20	\N	plasmapen	60000.00	efectivo	pagado	2026-05-18 18:14:21.461609	\N
11	22	19	Control gine FONASA	9593.00	debito	pagado	2026-05-18 19:33:32.642419	\N
12	23	6	SAYANA	22000.00	transferencia	pagado	2026-05-18 21:31:07.885105	\N
13	24	13	INSERCIÓN DISPOSITIVO NO HORMONAL	40000.00	transferencia	pagado	2026-05-18 21:32:01.561236	\N
14	25	1	PAP	8000.00	debito	pendiente	2026-05-18 21:32:43.099605	\N
15	25	1	PAP	8000.00	debito	pendiente	2026-05-18 21:34:36.328774	\N
16	26	19	Control gine FONASA	9593.00	fonasa	pendiente	2026-05-18 21:35:19.542684	\N
17	27	7	INYECCION	5000.00	transferencia	pagado	2026-05-18 21:35:56.285424	\N
18	28	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-18 21:37:05.595633	\N
19	29	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-18 21:38:47.609091	\N
20	30	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-18 21:41:45.466884	\N
21	31	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-18 21:45:05.122766	\N
22	32	1	PAP	8000.00	transferencia	pagado	2026-05-18 21:45:45.178372	PAP BASE LIQUIDA
24	2	21	Control gine estudiantes	12000.00	transferencia	pagado	2026-05-19 13:38:56.286592	\N
25	2	1	PAP	8000.00	transferencia	pagado	2026-05-19 13:40:18.195001	\N
26	34	1	PAP	8000.00	transferencia	pagado	2026-05-19 14:55:47.766976	\N
27	29	10	PLASMAPEN	80000.00	efectivo	pagado	2026-05-19 16:06:50.611025	\N
28	36	23	Online particular	10000.00	transferencia	pagado	2026-05-19 16:40:04.769921	\N
29	37	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-19 16:42:57.34122	\N
30	38	7	INYECCION	5000.00	transferencia	pagado	2026-05-19 16:43:52.710403	\N
31	39	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-19 16:46:13.894142	\N
32	40	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-19 16:46:46.023509	\N
33	42	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-20 16:40:41.70023	\N
34	43	6	SAYANA	22000.00	efectivo	pagado	2026-05-20 16:41:21.178884	\N
35	45	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-20 16:43:55.997836	\N
36	47	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-20 16:44:49.797683	\N
37	48	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-20 16:45:50.202293	\N
50	49	19	Control gine FONASA	9593.00	efectivo	pagado	2026-05-21 16:33:43.687325	\N
51	51	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-22 17:08:39.957629	\N
52	52	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-22 17:09:08.108656	\N
53	53	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-22 17:09:25.824017	\N
54	53	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-22 17:09:25.951228	\N
55	54	21	Control gine estudiantes	12000.00	transferencia	pagado	2026-05-22 17:16:56.191187	\N
56	51	1	PAP	8000.00	debito	pagado	2026-05-22 17:51:58.898827	\N
57	51	2	FLUJO PARTICULAR	6150.00	debito	pagado	2026-05-22 17:52:05.259637	\N
59	55	1	PAP	8000.00	efectivo	pagado	2026-05-22 20:26:13.665504	\N
60	57	6	SAYANA	22000.00	efectivo	pagado	2026-05-25 10:56:10.83466	\N
61	58	19	Control gine FONASA	9593.00	debito	pagado	2026-05-25 13:53:55.307757	\N
62	59	19	Control gine FONASA	9593.00	debito	pagado	2026-05-25 14:05:54.14349	\N
63	60	19	Control gine FONASA	9593.00	debito	pagado	2026-05-25 14:06:08.128811	\N
65	61	19	Control gine FONASA	9593.00	debito	pagado	2026-05-25 14:06:58.400657	\N
67	63	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-25 16:18:40.790392	\N
68	63	6	SAYANA	22000.00	efectivo	pagado	2026-05-25 16:32:46.37528	\N
74	7	1	PAP	8000.00	debito	pagado	2026-05-25 17:26:39.017678	\N
75	60	6	SAYANA	22000.00	debito	pagado	2026-05-25 17:49:04.035315	\N
76	2	1	PAP	8000.00	debito	pagado	2026-05-25 17:49:44.332618	\N
77	2	1	PAP	8000.00	debito	pagado	2026-05-25 17:50:19.105641	\N
78	64	20	Control gine particular	20000.00	transferencia	pagado	2026-05-25 18:04:03.582878	\N
79	66	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-25 18:04:48.867357	\N
80	66	1	PAP	8000.00	debito	pagado	2026-05-25 19:13:05.55609	\N
81	61	1	PAP	8000.00	transferencia	pendiente	2026-05-25 19:53:13.373882	\N
82	61	16	PCR VPH	15000.00	transferencia	pendiente	2026-05-25 19:53:22.446821	\N
83	61	2	FLUJO PARTICULAR	6150.00	transferencia	pendiente	2026-05-25 19:53:30.743989	\N
84	64	1	PAP	8000.00	debito	pagado	2026-05-25 19:54:37.501476	\N
85	67	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-25 20:05:40.464939	\N
86	68	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-25 20:31:28.67344	\N
87	68	1	PAP	8000.00	debito	pagado	2026-05-25 20:31:45.643287	\N
88	68	5	PANEL PARTICULAR	6920.00	debito	pagado	2026-05-25 20:32:08.818218	\N
89	69	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-25 20:34:31.977543	\N
90	70	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-25 20:37:08.368218	\N
91	71	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-25 20:39:32.22895	\N
92	72	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-25 20:43:15.88048	\N
93	70	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-25 20:44:10.707999	\N
94	70	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-25 20:44:10.749778	\N
95	70	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-25 20:44:10.877777	\N
96	76	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-25 20:51:59.889508	\N
98	7	1	PAP	8000.00	debito	pendiente	2026-05-25 21:57:47.479375	\N
99	79	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-26 12:48:40.315733	\N
100	72	2	FLUJO PARTICULAR	6150.00	debito	pagado	2026-05-26 14:10:36.803018	\N
101	72	1	PAP	8000.00	debito	pagado	2026-05-26 14:10:47.360601	\N
102	72	6	SAYANA	22000.00	debito	pagado	2026-05-26 14:10:53.396055	\N
103	7	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-26 17:15:38.483768	\N
104	7	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-26 17:26:53.979632	\N
105	7	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-26 17:38:19.673152	\N
106	7	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-26 17:39:33.292484	\N
107	7	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-26 17:46:58.733561	\N
108	80	21	Control gine estudiantes	12000.00	debito	pagado	2026-05-26 18:01:54.502195	\N
109	7	19	Control gine FONASA	9593.00	fonasa	pagado	2026-05-26 18:03:24.650453	\N
\.


--
-- Data for Name: profesional; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profesional (id, rut, nombre, apellido, especialidad) FROM stdin;
1	20.437.635-2	Javiera Alejandra	Silva Catalán	Matrona
2	18411268-k	Valentina	Leal	Matrona
\.


--
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuario (id, nombre, email, password_hash, rol, activo, creado_en, profesional_id) FROM stdin;
1	Administrador	admin@saberes.cl	$2b$10$t2J/LVu5xSzL6xR9CkK9T.rSZclbftuF0BKLqEBYP09lZ/G.g9wFi	admin	t	2026-05-15 02:35:36.098971	\N
5	Secretaria Catalina	Catalina@saberes.cl	$2b$10$acnLQeZD4ZDtwO9NjvPwFeJgcXQCTJKsNqCufSVUJAvHJHuX4FAj.	secretaria	t	2026-05-16 01:05:01.915841	\N
2	Matrona Javiera	Javiera@saberes.cl	$2b$10$IOpBBt1xQ4M8QjpJHs7IGutVczS/0K3zEe6pJqDs5z3izzdjZV.ee	matrona	t	2026-05-15 02:56:42.47696	1
3	Matrona Valentina	Valentina@saberes.cl	$2b$10$404ZSL6wmLym70bGhlG0NeAJcxYhUuBLiL1T1fOAft5PUXwyaVQDa	matrona	t	2026-05-15 03:10:23.014656	2
\.


--
-- Name: archivo_paciente_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.archivo_paciente_id_seq', 8, true);


--
-- Name: bloqueo_horario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bloqueo_horario_id_seq', 40, true);


--
-- Name: catalogo_procedimiento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.catalogo_procedimiento_id_seq', 23, true);


--
-- Name: cita_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cita_id_seq', 108, true);


--
-- Name: encuesta_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.encuesta_id_seq', 7, true);


--
-- Name: ficha_clinica_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ficha_clinica_id_seq', 13, true);


--
-- Name: ficha_ingreso_1_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ficha_ingreso_1_id_seq', 6, true);


--
-- Name: ficha_ingreso_2_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ficha_ingreso_2_id_seq', 24, true);


--
-- Name: flujo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.flujo_id_seq', 7, true);


--
-- Name: frase_diaria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.frase_diaria_id_seq', 1, false);


--
-- Name: paciente_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.paciente_id_seq', 80, true);


--
-- Name: pago_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pago_id_seq', 105, true);


--
-- Name: pap_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pap_id_seq', 26, true);


--
-- Name: procedimiento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.procedimiento_id_seq', 109, true);


--
-- Name: profesional_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.profesional_id_seq', 2, true);


--
-- Name: usuario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuario_id_seq', 5, true);


--
-- Name: archivo_paciente archivo_paciente_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archivo_paciente
    ADD CONSTRAINT archivo_paciente_pkey PRIMARY KEY (id);


--
-- Name: bloqueo_horario bloqueo_horario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bloqueo_horario
    ADD CONSTRAINT bloqueo_horario_pkey PRIMARY KEY (id);


--
-- Name: catalogo_procedimiento catalogo_procedimiento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.catalogo_procedimiento
    ADD CONSTRAINT catalogo_procedimiento_pkey PRIMARY KEY (id);


--
-- Name: cita cita_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cita
    ADD CONSTRAINT cita_pkey PRIMARY KEY (id);


--
-- Name: encuesta encuesta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.encuesta
    ADD CONSTRAINT encuesta_pkey PRIMARY KEY (id);


--
-- Name: ficha_clinica ficha_clinica_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ficha_clinica
    ADD CONSTRAINT ficha_clinica_pkey PRIMARY KEY (id);


--
-- Name: ficha_ingreso_1 ficha_ingreso_1_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ficha_ingreso_1
    ADD CONSTRAINT ficha_ingreso_1_pkey PRIMARY KEY (id);


--
-- Name: ficha_ingreso_2 ficha_ingreso_2_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ficha_ingreso_2
    ADD CONSTRAINT ficha_ingreso_2_pkey PRIMARY KEY (id);


--
-- Name: flujo flujo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flujo
    ADD CONSTRAINT flujo_pkey PRIMARY KEY (id);


--
-- Name: frase_diaria frase_diaria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frase_diaria
    ADD CONSTRAINT frase_diaria_pkey PRIMARY KEY (id);


--
-- Name: paciente paciente_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paciente
    ADD CONSTRAINT paciente_pkey PRIMARY KEY (id);


--
-- Name: pago pago_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT pago_pkey PRIMARY KEY (id);


--
-- Name: pap pap_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pap
    ADD CONSTRAINT pap_pkey PRIMARY KEY (id);


--
-- Name: procedimiento procedimiento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procedimiento
    ADD CONSTRAINT procedimiento_pkey PRIMARY KEY (id);


--
-- Name: profesional profesional_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profesional
    ADD CONSTRAINT profesional_pkey PRIMARY KEY (id);


--
-- Name: profesional profesional_rut_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profesional
    ADD CONSTRAINT profesional_rut_key UNIQUE (rut);


--
-- Name: usuario usuario_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_email_key UNIQUE (email);


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id);


--
-- Name: idx_bloqueo_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bloqueo_fecha ON public.bloqueo_horario USING btree (fecha_inicio);


--
-- Name: idx_cita_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cita_fecha ON public.cita USING btree (fecha_hora);


--
-- Name: idx_cita_paciente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cita_paciente ON public.cita USING btree (paciente_id);


--
-- Name: idx_cita_profesional; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cita_profesional ON public.cita USING btree (profesional_id);


--
-- Name: idx_fi1_paciente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fi1_paciente ON public.ficha_ingreso_1 USING btree (paciente_id);


--
-- Name: idx_fi2_paciente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fi2_paciente ON public.ficha_ingreso_2 USING btree (paciente_id);


--
-- Name: idx_ficha_paciente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ficha_paciente ON public.ficha_clinica USING btree (paciente_id);


--
-- Name: idx_flujo_paciente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_flujo_paciente ON public.flujo USING btree (paciente_id);


--
-- Name: idx_pago_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pago_fecha ON public.pago USING btree (fecha);


--
-- Name: idx_pago_paciente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pago_paciente ON public.pago USING btree (paciente_id);


--
-- Name: idx_pap_paciente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pap_paciente ON public.pap USING btree (paciente_id);


--
-- Name: idx_procedimiento_paciente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_procedimiento_paciente ON public.procedimiento USING btree (paciente_id);


--
-- Name: archivo_paciente archivo_paciente_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archivo_paciente
    ADD CONSTRAINT archivo_paciente_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.paciente(id) ON DELETE CASCADE;


--
-- Name: bloqueo_horario bloqueo_horario_creado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bloqueo_horario
    ADD CONSTRAINT bloqueo_horario_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuario(id);


--
-- Name: bloqueo_horario bloqueo_horario_profesional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bloqueo_horario
    ADD CONSTRAINT bloqueo_horario_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES public.profesional(id);


--
-- Name: cita cita_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cita
    ADD CONSTRAINT cita_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.paciente(id) ON DELETE RESTRICT;


--
-- Name: cita cita_profesional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cita
    ADD CONSTRAINT cita_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES public.profesional(id) ON DELETE RESTRICT;


--
-- Name: encuesta encuesta_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.encuesta
    ADD CONSTRAINT encuesta_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.paciente(id) ON DELETE CASCADE;


--
-- Name: ficha_clinica ficha_clinica_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ficha_clinica
    ADD CONSTRAINT ficha_clinica_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.paciente(id) ON DELETE RESTRICT;


--
-- Name: ficha_clinica ficha_clinica_profesional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ficha_clinica
    ADD CONSTRAINT ficha_clinica_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES public.profesional(id) ON DELETE RESTRICT;


--
-- Name: ficha_ingreso_1 ficha_ingreso_1_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ficha_ingreso_1
    ADD CONSTRAINT ficha_ingreso_1_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.paciente(id) ON DELETE RESTRICT;


--
-- Name: ficha_ingreso_1 ficha_ingreso_1_profesional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ficha_ingreso_1
    ADD CONSTRAINT ficha_ingreso_1_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES public.profesional(id) ON DELETE RESTRICT;


--
-- Name: ficha_ingreso_2 ficha_ingreso_2_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ficha_ingreso_2
    ADD CONSTRAINT ficha_ingreso_2_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.paciente(id) ON DELETE RESTRICT;


--
-- Name: ficha_ingreso_2 ficha_ingreso_2_profesional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ficha_ingreso_2
    ADD CONSTRAINT ficha_ingreso_2_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES public.profesional(id) ON DELETE RESTRICT;


--
-- Name: flujo flujo_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flujo
    ADD CONSTRAINT flujo_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.paciente(id) ON DELETE RESTRICT;


--
-- Name: flujo flujo_profesional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flujo
    ADD CONSTRAINT flujo_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES public.profesional(id);


--
-- Name: frase_diaria frase_diaria_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frase_diaria
    ADD CONSTRAINT frase_diaria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id);


--
-- Name: pago pago_cita_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT pago_cita_id_fkey FOREIGN KEY (cita_id) REFERENCES public.cita(id) ON DELETE SET NULL;


--
-- Name: pago pago_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT pago_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.paciente(id) ON DELETE RESTRICT;


--
-- Name: pap pap_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pap
    ADD CONSTRAINT pap_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.paciente(id) ON DELETE RESTRICT;


--
-- Name: pap pap_profesional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pap
    ADD CONSTRAINT pap_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES public.profesional(id);


--
-- Name: procedimiento procedimiento_catalogo_procedimiento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procedimiento
    ADD CONSTRAINT procedimiento_catalogo_procedimiento_id_fkey FOREIGN KEY (catalogo_procedimiento_id) REFERENCES public.catalogo_procedimiento(id);


--
-- Name: procedimiento procedimiento_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procedimiento
    ADD CONSTRAINT procedimiento_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.paciente(id) ON DELETE RESTRICT;


--
-- Name: usuario usuario_profesional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES public.profesional(id);


--
-- PostgreSQL database dump complete
--

\unrestrict lIVTKY6yDn3gpI4XkEypR7A8n5RnvmeELEJgP8GvPXhabEWFfQJSOZp1wqbcg71

