-- Table: public.identities

-- DROP TABLE public.identities;

CREATE TABLE public.identities
(
    tx_hash VARCHAR(128) NOT NULL, --Tx Hash of the identity creation
    device_key VARCHAR(44) NOT NULL, --Device Key
    network VARCHAR(64) NOT NULL, -- Network name
    manager_type VARCHAR(64) NULL, --Identity manager type
    manager_address VARCHAR(44) NULL, --Identity manager address
    identity VARCHAR(44) NULL, --Proxy contract address
    created timestamp with time zone  NOT NULL DEFAULT now(), --Created on
    CONSTRAINT identities_pkey PRIMARY KEY (tx_hash)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.identities
  OWNER TO root;
