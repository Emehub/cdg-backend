-- CDG Seed Data

INSERT INTO branches (id, name, code, zone, address, is_active, created_at, updated_at) VALUES
  ('a21caffc-d434-41d7-b9ea-62b545b8558b', 'Accra Main', 'ACC-MAIN', 'Greater Accra', 'Ring Road Central, Accra', true, '2026-05-22T19:53:09.293Z', '2026-05-22T19:53:09.293Z'),
  ('c84a77f2-ce2a-4378-9dd2-d5f8917c1c5c', 'Kumasi Central', 'KSI-CTRL', 'Ashanti', 'Kejetia, Kumasi', true, '2026-05-22T19:53:09.293Z', '2026-05-22T19:53:09.293Z'),
  ('fe42fa0d-d85b-4295-a039-b57547718a5d', 'Takoradi Main', 'TKD-MAIN', 'Western', 'Market Circle, Takoradi', true, '2026-05-22T19:53:09.293Z', '2026-05-22T19:53:09.293Z'),
  ('d9d1d8b7-1ca6-40ee-b2ff-0783cc318f0b', 'Tamale Main', 'TML-MAIN', 'Northern', 'Central Market, Tamale', true, '2026-05-22T19:53:09.293Z', '2026-05-22T19:53:09.293Z'),
  ('62c0eafb-0b6a-4460-9d5c-cd5e9df63c47', 'Cape Coast', 'CPE-MAIN', 'Central', 'Kotokuraba Road, Cape Coast', true, '2026-05-22T19:53:09.293Z', '2026-05-22T19:53:09.293Z'),
  ('0bf44b10-f599-41cf-8d83-81bb52541441', 'Ho Branch', 'HO-MAIN', 'Volta', 'Ho Central, Ho', true, '2026-05-22T19:53:09.293Z', '2026-05-22T19:53:09.293Z'),
  ('c1a6fb1d-4368-4912-ae5c-02be10ba9d90', 'Sunyani Branch', 'SUN-MAIN', 'Bono', 'Sunyani Market, Sunyani', true, '2026-05-22T19:53:09.293Z', '2026-05-22T19:53:09.293Z'),
  ('539584ef-a859-4d1b-aea8-323a5c66ef70', 'Bolgatanga Branch', 'BLG-MAIN', 'Upper East', 'Bolgatanga Central', true, '2026-05-22T19:53:09.293Z', '2026-05-22T19:53:09.293Z')
ON CONFLICT (code) DO NOTHING;

INSERT INTO staff (id, staff_code, username, password_hash, full_name, role, branch_id, terminal_number, created_at, updated_at) VALUES
  ('a52a39f0-5a14-44bd-9bca-0798888f9537', 'ADM-0001', 'admin', '$2a$12$E.Bd9Z13spxtKO9GC3vJrObtFySfgvtNfCVkDQvAlF221K6dETacK', 'System Administrator', 'IT_ADMIN', 'a21caffc-d434-41d7-b9ea-62b545b8558b', NULL, '2026-05-22T19:53:09.293Z', '2026-05-22T19:53:09.293Z'),
  ('1a505b83-6e23-46de-bd6f-8b81fe3062a9', 'FIN-0001', 'finance.admin', '$2a$12$Mjx/qlbXweaz.zpgCoyaPOlGyXOujlDZ8dWCoWHNFj42vqrU72kLC', 'Ama Owusu', 'FINANCE_ADMIN', 'a21caffc-d434-41d7-b9ea-62b545b8558b', NULL, '2026-05-22T19:53:09.293Z', '2026-05-22T19:53:09.293Z'),
  ('64be7dcf-55b6-416a-85fe-38f69e1477e6', 'MGR-ACC-001', 'kofi.manager', '$2a$12$gJ7jSq.j9Iz.wzp010FhYuEfnG5OGPMBY2ev4KgFVNlbLIE015oYa', 'Kofi Mensah', 'BRANCH_MANAGER', 'a21caffc-d434-41d7-b9ea-62b545b8558b', NULL, '2026-05-22T19:53:09.293Z', '2026-05-22T19:53:09.293Z'),
  ('7d8a4ca3-c4b6-483d-acef-9eb0eb64aefd', 'MGR-KSI-001', 'abena.manager', '$2a$12$gJ7jSq.j9Iz.wzp010FhYuEfnG5OGPMBY2ev4KgFVNlbLIE015oYa', 'Abena Frimpong', 'BRANCH_MANAGER', 'c84a77f2-ce2a-4378-9dd2-d5f8917c1c5c', NULL, '2026-05-22T19:53:09.293Z', '2026-05-22T19:53:09.293Z'),
  ('5232f2d6-a268-4c2d-bdef-05e63a4f941a', 'STF-ACC-001', 'kweku.staff', '$2a$12$YySPQMuZQuO3dWvir4mzIe70dI78XjnM.jbPWmEAeY9tkrfdl0.9u', 'Kweku Asante', 'TERMINAL_STAFF', 'a21caffc-d434-41d7-b9ea-62b545b8558b', 'T-01', '2026-05-22T19:53:09.293Z', '2026-05-22T19:53:09.293Z'),
  ('94efa582-63a0-43e0-919e-2bfec836e454', 'STF-ACC-002', 'efua.staff', '$2a$12$YySPQMuZQuO3dWvir4mzIe70dI78XjnM.jbPWmEAeY9tkrfdl0.9u', 'Efua Mensah', 'TERMINAL_STAFF', 'a21caffc-d434-41d7-b9ea-62b545b8558b', 'T-02', '2026-05-22T19:53:09.293Z', '2026-05-22T19:53:09.293Z'),
  ('d637ce8f-d320-47b9-b879-32eeed3b2f90', 'STF-KSI-001', 'yaw.staff', '$2a$12$YySPQMuZQuO3dWvir4mzIe70dI78XjnM.jbPWmEAeY9tkrfdl0.9u', 'Yaw Darko', 'TERMINAL_STAFF', 'c84a77f2-ce2a-4378-9dd2-d5f8917c1c5c', 'T-01', '2026-05-22T19:53:09.293Z', '2026-05-22T19:53:09.293Z'),
  ('8f7b80a9-1d82-42cc-bcd3-dc77dd82d189', 'STF-TKD-001', 'akosua.staff', '$2a$12$YySPQMuZQuO3dWvir4mzIe70dI78XjnM.jbPWmEAeY9tkrfdl0.9u', 'Akosua Boateng', 'TERMINAL_STAFF', 'fe42fa0d-d85b-4295-a039-b57547718a5d', 'T-01', '2026-05-22T19:53:09.293Z', '2026-05-22T19:53:09.293Z')
ON CONFLICT (username) DO NOTHING;

INSERT INTO fee_rules (id, parcel_type, destination_zone, min_fee, standard_fee, effective_from, created_by_id, approved_by_id, created_at) VALUES
  ('5f88b222-9958-4d59-904f-0fbedb34b982', 'GENERAL', 'Ashanti', 35, 45, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('ba15468d-74ce-490b-92a0-5e4a3a88e342', 'GENERAL', 'Western', 38, 48, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('1bf26e4e-a50e-4188-9596-345d53d57cff', 'GENERAL', 'Northern', 55, 65, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('ae28cbcc-a0af-41fd-951e-f3625d9d826f', 'GENERAL', 'Central', 30, 38, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('d3178871-8666-49b8-b249-22209d2cf788', 'GENERAL', 'Volta', 35, 42, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('5d8d23f0-1c4a-4037-8e9b-e0df065d21ad', 'GENERAL', 'Bono', 42, 52, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('4660eda3-bcae-495c-9da5-e722bacbe655', 'GENERAL', 'Upper East', 60, 72, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('5bd2c781-e8b4-4058-b94f-d33fdca8508a', 'GENERAL', 'Greater Accra', 20, 28, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('33b74914-4162-4e4b-8bac-7211650f1a34', 'DOCUMENT', 'Ashanti', 20, 28, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('cb97a550-c81a-463e-9e77-303c7cc385e8', 'DOCUMENT', 'Western', 22, 30, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('e7fb0f8c-8689-42b3-8eec-06a2769c0c32', 'DOCUMENT', 'Northern', 30, 40, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('cbfd6b89-0a0b-4594-b240-3342baa7ad66', 'DOCUMENT', 'Central', 18, 25, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('127fbab7-7532-46b7-9043-4de7e7d9594f', 'DOCUMENT', 'Volta', 20, 28, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('17c63fb2-6f88-48ab-8fe5-001b16a92802', 'DOCUMENT', 'Bono', 25, 33, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('fe408f94-5190-427f-ba22-33ab6deed05f', 'DOCUMENT', 'Upper East', 35, 45, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('7507b19d-7705-4990-b7a7-ab11f62ed303', 'DOCUMENT', 'Greater Accra', 12, 18, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('9eede7ce-521e-4f08-966f-4b46dd6905aa', 'FRAGILE', 'Ashanti', 55, 70, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('1f31f7f7-13d4-421e-a2ec-e02adab5a38a', 'FRAGILE', 'Western', 58, 75, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('c47e403d-c9bb-4cda-9393-688acce858be', 'FRAGILE', 'Northern', 80, 100, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('7f695b21-a89b-4848-b76f-47a75a3e4751', 'FRAGILE', 'Central', 48, 62, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('3f9c1f3f-c867-491e-b116-b93879707e3b', 'FRAGILE', 'Volta', 55, 70, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('b0f818a0-cf17-410a-b177-58cb092c6a5f', 'FRAGILE', 'Bono', 65, 82, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('f88a4485-272d-4608-89fe-b41d0f47fa7d', 'FRAGILE', 'Upper East', 90, 115, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('26e1a6e0-390a-4ec1-a34d-a0b22bf10793', 'FRAGILE', 'Greater Accra', 35, 48, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('bb1da214-062f-41e6-8936-fb9e121909e9', 'ELECTRONICS', 'Ashanti', 65, 85, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('221cab45-6e26-467f-973e-fc24764d4fd2', 'ELECTRONICS', 'Western', 68, 88, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('4adefe3f-3321-40d8-a5b2-e567b8d4e2c3', 'ELECTRONICS', 'Northern', 95, 120, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('76017938-86c8-4eed-8d04-79659938e18d', 'ELECTRONICS', 'Central', 58, 75, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('f65a6e1f-5556-4f75-b53e-c39669d7e9ec', 'ELECTRONICS', 'Volta', 65, 85, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('c1e25368-896e-408b-a989-0556f1a9d68c', 'ELECTRONICS', 'Bono', 75, 96, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('0953ada0-52ea-4242-8503-786dfab232e0', 'ELECTRONICS', 'Upper East', 110, 140, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('85951204-46c4-4442-a4a5-3066ac50cac5', 'ELECTRONICS', 'Greater Accra', 40, 55, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('512ed628-5c58-4b18-aac0-730de3d90bb6', 'CLOTHING', 'Ashanti', 28, 38, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('f4a03360-8e12-40db-b9b9-0a1a836574ce', 'CLOTHING', 'Western', 30, 40, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('675b826d-5ca1-44d4-863b-74f5d09c8d2f', 'CLOTHING', 'Northern', 45, 58, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('c069c93d-4c64-4542-a962-cdd888898b06', 'CLOTHING', 'Central', 25, 33, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('aa96a153-6e5d-4c56-9f14-85c166a39e0a', 'CLOTHING', 'Volta', 28, 38, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('eac181f7-140f-4df9-bba7-e1f4338ab847', 'CLOTHING', 'Bono', 35, 45, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('50d9497b-e558-417e-9260-175314252fae', 'CLOTHING', 'Upper East', 52, 66, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z'),
  ('29566247-827e-486b-9327-b23288c03efc', 'CLOTHING', 'Greater Accra', 18, 25, '2026-01-01', 'a52a39f0-5a14-44bd-9bca-0798888f9537', '1a505b83-6e23-46de-bd6f-8b81fe3062a9', '2026-05-22T19:53:09.293Z')
;
