import { Table } from "antd";
import ResizableTitle from "./table/ResizableTitle";
import { useState } from "react";


export default function WmsTable(props: any) {
  const { columns, ...rest } = props;

  const [cols, setCols] = useState(
    columns.map((col: any) => ({
      ...col,
      width: col.width || 120,
    }))
  );

  const handleResize =
    (index: number) =>
    (_: any, { size }: any) => {
      setCols((prev: any[]) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          width: size.width,
        };
        return next;
      });
    };

  const mergedColumns = cols.map((col: any, index: number) => ({
    ...col,
    onHeaderCell: (column: any) => ({
      width: column.width,
      onResize: handleResize(index),
    }),
  }));

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
