import React from "react";

// Define types for the props of each component

// Props for the SectionHeader component
interface SectionHeaderProps {
    title: string;
    subtitle: string;
}

// Props for the HighlightCard component
interface HighlightCardProps {
    imageSrc: string;
    altText: string;
    iconClass: string;
    iconColor: string;
    backgroundColor: string;
    title: string;
    description: string;
    isImageFirst: boolean;
}

// Props for the CardContent component
interface CardContentProps {
    iconClass: string;
    iconColor: string;
    backgroundColor: string;
    title: string;
    description: string;
    alignment: string;
}

const Highlights: React.FC = () => {
    return (
        <div id="highlights" className="py-4 px-4 lg:px-8 mx-0 my-6 lg:mx-8">
            <SectionHeader
                title="Powerful Everywhere"
                subtitle="Amet consectetur adipiscing elit..."
            />
            <HighlightCard
                imageSrc="/demo/images/landing/mockup.svg"
                altText="mockup mobile"
                iconClass="pi pi-fw pi-mobile"
                iconColor="text-purple-700"
                backgroundColor="bg-purple-200"
                title="Congue Quisque Egestas"
                description="Lectus arcu bibendum at varius vel pharetra vel turpis nunc. Eget aliquet nibh praesent tristique magna sit amet purus gravida. Sit amet mattis vulputate enim nulla aliquet."
                isImageFirst={true}
            />
            <HighlightCard
                imageSrc="/demo/images/landing/mockup-desktop.svg"
                altText="mockup desktop"
                iconClass="pi pi-fw pi-desktop"
                iconColor="text-yellow-700"
                backgroundColor="bg-yellow-200"
                title="Celerisque Eu Ultrices"
                description="Adipiscing commodo elit at imperdiet dui. Viverra nibh cras pulvinar mattis nunc sed blandit libero. Suspendisse in est ante in. Mauris pharetra et ultrices neque ornare aenean euismod elementum nisi."
                isImageFirst={false}
            />
        </div>
    );
};

// SectionHeader component
const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle }) => {
    return (
        <div className="text-center">
            <h2 className="text-900 font-normal mb-2">{title}</h2>
            <span className="text-600 text-2xl">{subtitle}</span>
        </div>
    );
};

// HighlightCard component
const HighlightCard: React.FC<HighlightCardProps> = ({
    imageSrc,
    altText,
    iconClass,
    iconColor,
    backgroundColor,
    title,
    description,
    isImageFirst,
}) => {
    return (
        <div className="grid my-8 pt-2 md:pt-8">
            {isImageFirst ? (
                <>
                    <div
                        className="flex justify-content-center col-12 lg:col-6 bg-purple-100 p-0 flex-order-1 lg:flex-order-0"
                        style={{ borderRadius: "8px" }}
                    >
                        <img src={imageSrc} className="w-11" alt={altText} />
                    </div>
                    <CardContent
                        iconClass={iconClass}
                        iconColor={iconColor}
                        backgroundColor={backgroundColor}
                        title={title}
                        description={description}
                        alignment="text-center lg:text-right"
                    />
                </>
            ) : (
                <>
                    <CardContent
                        iconClass={iconClass}
                        iconColor={iconColor}
                        backgroundColor={backgroundColor}
                        title={title}
                        description={description}
                        alignment="text-center lg:text-left"
                    />
                    <div
                        className="flex justify-content-end flex-order-1 sm:flex-order-2 col-12 lg:col-6 bg-yellow-100 p-0"
                        style={{ borderRadius: "8px" }}
                    >
                        <img src={imageSrc} className="w-11" alt={altText} />
                    </div>
                </>
            )}
        </div>
    );
};

// CardContent component
const CardContent: React.FC<CardContentProps> = ({
    iconClass,
    iconColor,
    backgroundColor,
    title,
    description,
    alignment,
}) => {
    return (
        <div className={`col-12 lg:col-6 my-auto flex flex-column ${alignment}`}>
            <div
                className={`flex align-items-center justify-content-center ${backgroundColor}`}
                style={{
                    width: "4.2rem",
                    height: "4.2rem",
                    borderRadius: "10px",
                }}
            >
                <i className={`${iconClass} text-5xl ${iconColor}`}></i>
            </div>
            <h2 className="line-height-1 text-900 text-4xl font-normal">{title}</h2>
            <span
                className="text-700 text-2xl line-height-3 mr-0 md:mr-2"
                style={{ maxWidth: "650px" }}
            >
                {description}
            </span>
        </div>
    );
};

export default Highlights;
