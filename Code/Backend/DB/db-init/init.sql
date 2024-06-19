CREATE TABLE IF NOT EXISTS "router_to_priorities" (
    "router_id" SERIAL PRIMARY KEY,
    "service_name" VARCHAR(50) NOT NULL,
    "priority" INTEGER NOT NULL
);
