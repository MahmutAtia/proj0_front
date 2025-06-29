export default function ChatLayout({ children }) {
    return (
        <div className="surface-ground min-h-screen">
            <div className="p-4">
                {children}
            </div>
        </div>
    );
}
