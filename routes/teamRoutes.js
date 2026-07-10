import router from 'express';
import {updateLocation} from "../controllers/teamController.js";

router.put("/location", updateLocation);

export default router;