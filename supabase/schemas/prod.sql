

































































































































































































































REVOKE ALL ON FUNCTION "public"."assert_payload_user_id_matches_auth"("p_payload_user_id" "uuid", "p_auth_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."assert_payload_user_id_matches_auth"("p_payload_user_id" "uuid", "p_auth_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assert_payload_user_id_matches_auth"("p_payload_user_id" "uuid", "p_auth_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_is_anonymous_users_older_than"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_is_anonymous_users_older_than"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_is_anonymous_users_older_than"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."fetch_user_items"("p_user_id" "uuid", "p_last_synced_at" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fetch_user_items"("p_user_id" "uuid", "p_last_synced_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fetch_user_items"("p_user_id" "uuid", "p_last_synced_at" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reactivate_user_if_deleted"() TO "anon";
GRANT ALL ON FUNCTION "public"."reactivate_user_if_deleted"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reactivate_user_if_deleted"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."require_auth_user_id"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."require_auth_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."require_auth_user_id"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."require_auth_user_id_match"("p_user_id" "uuid", "p_param_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."require_auth_user_id_match"("p_user_id" "uuid", "p_param_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."require_auth_user_id_match"("p_user_id" "uuid", "p_param_name" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."rpc_min_timestamptz"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."rpc_min_timestamptz"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_min_timestamptz"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."soft_delete_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."soft_delete_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."soft_delete_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."upsert_fetch_user_items"("p_user_id" "uuid", "p_last_synced_at" timestamp with time zone, "p_user_items" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."upsert_fetch_user_items"("p_user_id" "uuid", "p_last_synced_at" timestamp with time zone, "p_user_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_fetch_user_items"("p_user_id" "uuid", "p_last_synced_at" timestamp with time zone, "p_user_items" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."upsert_fetch_user_scores"("p_user_id" "uuid", "p_last_synced_at" timestamp with time zone, "p_user_scores" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."upsert_fetch_user_scores"("p_user_id" "uuid", "p_last_synced_at" timestamp with time zone, "p_user_scores" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_fetch_user_scores"("p_user_id" "uuid", "p_last_synced_at" timestamp with time zone, "p_user_scores" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."upsert_user_items"("p_user_items" "jsonb", "p_history_enabled" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."upsert_user_items"("p_user_items" "jsonb", "p_history_enabled" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_user_items"("p_user_items" "jsonb", "p_history_enabled" boolean) TO "service_role";



REVOKE ALL ON FUNCTION "public"."upsert_user_scores"("p_user_scores" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."upsert_user_scores"("p_user_scores" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_user_scores"("p_user_scores" "jsonb") TO "service_role";
























GRANT ALL ON TABLE "public"."blocks" TO "anon";
GRANT ALL ON TABLE "public"."blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."blocks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."blocks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."blocks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."blocks_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."grammar" TO "anon";
GRANT ALL ON TABLE "public"."grammar" TO "authenticated";
GRANT ALL ON TABLE "public"."grammar" TO "service_role";



GRANT ALL ON SEQUENCE "public"."grammar_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."grammar_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."grammar_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."items" TO "anon";
GRANT ALL ON TABLE "public"."items" TO "authenticated";
GRANT ALL ON TABLE "public"."items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."items_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."items_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."items_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lessons" TO "anon";
GRANT ALL ON TABLE "public"."lessons" TO "authenticated";
GRANT ALL ON TABLE "public"."lessons" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lessons_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lessons_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lessons_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."levels" TO "anon";
GRANT ALL ON TABLE "public"."levels" TO "authenticated";
GRANT ALL ON TABLE "public"."levels" TO "service_role";



GRANT ALL ON SEQUENCE "public"."levels_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."levels_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."levels_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notes" TO "anon";
GRANT ALL ON TABLE "public"."notes" TO "authenticated";
GRANT ALL ON TABLE "public"."notes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_items" TO "anon";
GRANT ALL ON TABLE "public"."user_items" TO "authenticated";
GRANT ALL ON TABLE "public"."user_items" TO "service_role";



GRANT ALL ON TABLE "public"."user_items_history" TO "anon";
GRANT ALL ON TABLE "public"."user_items_history" TO "authenticated";
GRANT ALL ON TABLE "public"."user_items_history" TO "service_role";



GRANT ALL ON TABLE "public"."user_scores" TO "anon";
GRANT ALL ON TABLE "public"."user_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."user_scores" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































