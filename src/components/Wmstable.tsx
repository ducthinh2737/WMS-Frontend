import { Table } from "antd";
import ResizableTitle from "./table/ResizableTitle";
import { useState } from "react";


export default function WmsTable(props: any) {
  const { columns, ...rest } = props;

  const [widths, setWidths] = useState<Record<string, number>>({});

  const handleResize =
    (key: string) =>
    (_: any, { size }: any) => {
      setWidths((prev) => ({
        ...prev,
        [key]: size.width,
      }));
    };

  const mergedColumns = columns.map((col: any, index: number) => {
    const key = col.key || col.dataIndex || String(index);
    const width = widths[key] || col.width || 120;
    return {
      ...col,
      width,
      onHeaderCell: (column: any) => ({
        width,
        onResize: handleResize(key),
      }),
    };
  });

  return (
    <Table
      {...rest}
      columns={mergedColumns}
      components={{
        header: {
          cell: ResizableTitle,
        },
      }}
    />
  );
}
