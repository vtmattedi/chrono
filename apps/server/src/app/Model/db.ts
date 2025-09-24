import {neon} from "@neondatabase/serverless";
import { assertDotEnv } from "../Asserter";

assertDotEnv();
const sql = neon(process.env.DB_HOST as string);

export {sql};