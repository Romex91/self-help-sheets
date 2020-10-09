import React from "react";
import { EntriesTable } from "./EntriesTable.js";
import { EntriesTableModelImpl } from "./EntriesTableModel";
import { TestingBackendMap } from "./TestingBackendMap";
import { TestingGDriveAuthClient } from "./TestingGDriveAuthClient";
import _ from "lodash";
import { GDriveStates } from "./GDriveAuthClient.js";

const authClient = new TestingGDriveAuthClient();
authClient.setStateFromTest(GDriveStates.SIGNED_IN);
const backendMap = new TestingBackendMap();
const model = new EntriesTableModelImpl(backendMap, authClient);

(async () => {
  await Promise.all(
    _.range(0, 10).map((id) =>
      backendMap.addEntry("lorem ipsum " + id, "dolores " + id)
    )
  );
  await backendMap.setDescription("9", "3210002");

  model.sync();
})();

export function AppContent(props) {
  return <EntriesTable {...props} model={model} />;
}
