[33mcommit f481cca3e7b1f6bb54c20904f0fe9a5d72ca9635[m[33m ([m[1;36mHEAD[m[33m -> [m[1;32mmain[m[33m)[m
Author: dileeshaksh98 <dileeshaksh98@gmail.com>
Date:   Wed Jun 10 15:54:16 2026 +0530

    Disambiguate profiles embed on property detail (PGRST201)

[1mdiff --git a/src/lib/db/properties.repo.ts b/src/lib/db/properties.repo.ts[m
[1mindex 6fab1ed..de10b54 100644[m
[1m--- a/src/lib/db/properties.repo.ts[m
[1m+++ b/src/lib/db/properties.repo.ts[m
[36m@@ -6,7 +6,7 @@[m [mexport const PAGE_SIZE = 9[m
 [m
 const LIST_SELECT = '*, property_images(id, url, is_primary, sort_order)'[m
 const DETAIL_SELECT =[m
[31m-  '*, property_images(id, url, storage_path, is_primary, sort_order), profiles(id, full_name, avatar_url, phone, whatsapp, verification_level)'[m
[32m+[m[32m  '*, property_images(id, url, storage_path, is_primary, sort_order), profiles!properties_owner_id_fkey(id, full_name, avatar_url, phone, whatsapp, verification_level)'[m
 [m
 export interface ListResult {[m
   listings: Property[][m
