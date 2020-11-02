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
      backendMap.addEntry(
        "lorem ipsum " + id,
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum. " +
          id
      )
    )
  );
  await backendMap.setDescription("9", "3210002-" + Date.now());
  await backendMap.setDescription("8", "3210002-" + (Date.now() - 100000000));
  await backendMap.setDescription("7", "3210002-0" + (Date.now() - 200000000));
  await backendMap.setDescription("6", "3210002-0" + (Date.now() - 300000000));
  await backendMap.setDescription("5", "3210002-0" + (Date.now() - 400000000));
  await backendMap.setDescription("4", "3210002-0" + (Date.now() - 500000000));
  await backendMap.setDescription("3", "3210002-0" + (Date.now() - 600000000));
  await backendMap.setDescription("2", "3210002-0" + (Date.now() - 700000000));
  await backendMap.setDescription("1", "3210002-0" + (Date.now() - 800000000));
  await backendMap.setDescription("0", "3210002-0");

  model.sync();
})();

export function AppContent(props) {
  return <EntriesTable {...props} model={model} />;
}