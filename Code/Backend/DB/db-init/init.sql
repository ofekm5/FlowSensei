-- Enable the uuid-ossp extension to use the uuid_generate_v4() function
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the router_to_priorities table with UUID primary key
CREATE TABLE IF NOT EXISTS "router_to_priorities" (
    "router_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "service_name" VARCHAR(50) NOT NULL,
    "priority" INTEGER NOT NULL
);

-- Create the router_to_user table with router_id as a foreign key
CREATE TABLE IF NOT EXISTS "router_to_user" (
    "router_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_name" VARCHAR(50) NOT NULL,
    CONSTRAINT fk_router
      FOREIGN KEY ("router_id")
      REFERENCES "router_to_priorities" ("router_id")
);
