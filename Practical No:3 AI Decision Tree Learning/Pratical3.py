import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier, plot_tree, export_text
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import matplotlib.pyplot as plt

df = pd.read_csv("iris.csv")
df = df.drop(columns=["Id"])

X = df.drop(columns=["Species"])
y = df["Species"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42, stratify=y)

model = DecisionTreeClassifier(criterion="entropy", random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)

acc = accuracy_score(y_test, y_pred)
print(f"Accuracy: {acc:.4f}")
print()
print("Classification Report:")
print(classification_report(y_test, y_pred))
print("Confusion Matrix:")
print(confusion_matrix(y_test, y_pred))
print()
print("Text Representation of Tree:")
print(export_text(model, feature_names=list(X.columns)))

plt.figure(figsize=(16, 10))
plot_tree(model, feature_names=X.columns, class_names=model.classes_, filled=True, rounded=True, fontsize=9)
plt.title("Decision Tree - Iris Dataset")
plt.tight_layout()
plt.savefig("decision_tree.png", dpi=150)
print("Saved decision_tree.png")
