export default function PageHeader({ title, button }: any) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 20,
            }}
        >
            <div className="wms-title">{title}</div>
            {button}
        </div>
    );
}
